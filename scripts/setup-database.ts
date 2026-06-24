import { readFileSync } from 'fs';
import { join } from 'path';
import pg from 'pg';
import { loadEnvLocal } from './load-env-local';

loadEnvLocal();

type PoolerConfig = {
  prefix: 'aws-0' | 'aws-1';
  region: string;
};

const REGION_CANDIDATES = [
  'ap-northeast-1',
  'ap-southeast-1',
  'ap-south-1',
  'ap-southeast-2',
  'us-east-1',
  'us-west-1',
  'eu-west-1',
  'eu-central-1',
  'eu-west-2',
  'sa-east-1',
] as const;

function getProjectRef(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL in .env.local');
  }

  const ref = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!ref) {
    throw new Error('Could not parse project ref from NEXT_PUBLIC_SUPABASE_URL');
  }

  return ref;
}

function getPassword(): string {
  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  if (!password) {
    throw new Error(
      [
        'Missing SUPABASE_DB_PASSWORD in .env.local.',
        'Find or reset it in Supabase → Project Settings → Database → Database password.',
        'Or paste the full Session pooler URI from the dashboard as DATABASE_URL.',
      ].join('\n')
    );
  }

  return password;
}

function getPoolerCandidates(): PoolerConfig[] {
  const region = process.env.SUPABASE_DB_REGION?.trim();
  const prefix = (process.env.SUPABASE_POOLER_PREFIX?.trim() || 'aws-1') as
    | 'aws-0'
    | 'aws-1';

  if (region) {
    return [{ prefix, region }];
  }

  const candidates: PoolerConfig[] = [];
  for (const candidateRegion of REGION_CANDIDATES) {
    candidates.push({ prefix: 'aws-1', region: candidateRegion });
    candidates.push({ prefix: 'aws-0', region: candidateRegion });
  }
  return candidates;
}

function createClient(config: pg.ClientConfig): pg.Client {
  return new pg.Client({
    ...config,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 12_000,
  });
}

function clientFromDatabaseUrl(databaseUrl: string): pg.Client {
  return createClient({ connectionString: databaseUrl });
}

function clientFromPooler(
  ref: string,
  password: string,
  pooler: PoolerConfig
): pg.Client {
  return createClient({
    user: `postgres.${ref}`,
    password,
    host: `${pooler.prefix}-${pooler.region}.pooler.supabase.com`,
    port: 5432,
    database: 'postgres',
  });
}

function clientFromDirect(ref: string, password: string): pg.Client {
  return createClient({
    user: 'postgres',
    password,
    host: `db.${ref}.supabase.co`,
    port: 5432,
    database: 'postgres',
  });
}

function isTenantMissing(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('ENOTFOUND') ||
    message.includes('tenant/user') ||
    message.includes('no tenant identifier')
  );
}

function isPasswordFailure(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.toLowerCase().includes('password authentication failed');
}

async function connectWithBestHost(
  ref: string,
  password: string
): Promise<{ client: pg.Client; label: string }> {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (databaseUrl) {
    const client = clientFromDatabaseUrl(databaseUrl);
    await client.connect();
    return { client, label: 'DATABASE_URL' };
  }

  let passwordFailure: { pooler: PoolerConfig; message: string } | null = null;

  for (const pooler of getPoolerCandidates()) {
    const client = clientFromPooler(ref, password, pooler);
    try {
      await client.connect();
      return {
        client,
        label: `${pooler.prefix}-${pooler.region} pooler (IPv4)`,
      };
    } catch (error) {
      await client.end().catch(() => undefined);

      if (isPasswordFailure(error)) {
        passwordFailure = {
          pooler,
          message: error instanceof Error ? error.message : String(error),
        };
        break;
      }

      if (!isTenantMissing(error)) {
        throw error;
      }
    }
  }

  if (passwordFailure) {
    throw new Error(
      [
        `Connected to Supabase pooler (${passwordFailure.pooler.prefix}-${passwordFailure.pooler.region}) but the database password was rejected.`,
        passwordFailure.message,
        '',
        'Reset the password in Supabase → Project Settings → Database, update SUPABASE_DB_PASSWORD in .env.local, then run `npm run db:setup` again.',
        'Tip: avoid special characters like @ in the password, or paste the Session pooler URI as DATABASE_URL instead.',
      ].join('\n')
    );
  }

  const directClient = clientFromDirect(ref, password);
  try {
    await directClient.connect();
    return { client: directClient, label: 'direct connection (IPv6)' };
  } catch (directError) {
    await directClient.end().catch(() => undefined);

    const directMessage =
      directError instanceof Error ? directError.message : String(directError);

    throw new Error(
      [
        'Could not connect to Supabase Postgres.',
        'Windows often cannot reach the IPv6-only direct host `db.<project>.supabase.co`.',
        '',
        'Fix: open Supabase → Project Settings → Database → Connection string → Session pooler,',
        'copy the URI, and set it as DATABASE_URL in .env.local, then run `npm run db:setup` again.',
        '',
        `Last direct-connection error: ${directMessage}`,
      ].join('\n')
    );
  }
}

function readSql(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

async function main() {
  const ref = getProjectRef();
  const password = getPassword();

  console.log('Connecting to Supabase Postgres…');
  const { client, label } = await connectWithBestHost(ref, password);
  console.log(`Connected via ${label}.`);

  try {
    console.log('Applying supabase/schema.sql…');
    try {
      await client.query(readSql('supabase/schema.sql'));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('already exists')) {
        throw error;
      }
      console.log('Schema objects already exist — skipping full schema apply.');
    }

    console.log('Backfilling profiles for existing auth users…');
    await client.query(`
      INSERT INTO public.profiles (id, email, full_name)
      SELECT
        id,
        email,
        COALESCE(raw_user_meta_data ->> 'full_name', split_part(email, '@', 1))
      FROM auth.users
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log('Applying database patches…');
    await client.query(readSql('supabase/patches.sql'));

    console.log('Seeding charities…');
    await client.query(readSql('supabase/seed-charities.sql'));

    const { rows } = await client.query<{ count: string }>(
      "SELECT count(*)::text AS count FROM public.charities WHERE is_active = true"
    );
    console.log(`Done. Active charities: ${rows[0]?.count ?? '0'}`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
