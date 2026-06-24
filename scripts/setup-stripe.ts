import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { loadEnvLocal } from './load-env-local';
import { ensureStripeCatalog } from '../src/lib/stripe/prices';

loadEnvLocal();

function upsertEnvLocal(updates: Record<string, string>) {
  const path = join(process.cwd(), '.env.local');
  const lines = existsSync(path)
    ? readFileSync(path, 'utf8').split(/\r?\n/)
    : [];

  const keys = new Set(Object.keys(updates));
  const kept: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      kept.push(line);
      continue;
    }

    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      kept.push(line);
      continue;
    }

    const key = trimmed.slice(0, eq).trim();
    if (keys.has(key)) continue;
    kept.push(line);
  }

  while (kept.length > 0 && kept[kept.length - 1] === '') {
    kept.pop();
  }

  for (const [key, value] of Object.entries(updates)) {
    kept.push(`${key}=${value}`);
  }

  writeFileSync(path, `${kept.join('\n')}\n`, 'utf8');
}

async function main() {
  const { monthlyPriceId, yearlyPriceId, productId } =
    await ensureStripeCatalog();

  console.log('Stripe catalog ready.');
  console.log(`Product: ${productId}`);
  console.log(`Monthly price: ${monthlyPriceId}`);
  console.log(`Yearly price:  ${yearlyPriceId}`);

  upsertEnvLocal({
    STRIPE_MONTHLY_PRICE_ID: monthlyPriceId,
    STRIPE_YEARLY_PRICE_ID: yearlyPriceId,
  });

  console.log('\nUpdated .env.local with STRIPE_MONTHLY_PRICE_ID and STRIPE_YEARLY_PRICE_ID.');
  console.log(
    'If checkout still fails, confirm STRIPE_SECRET_KEY is set and restart the dev server.'
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
