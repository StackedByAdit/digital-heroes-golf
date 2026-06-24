import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/** Loads key=value pairs from `.env.local` into `process.env` (without overwriting). */
export function loadEnvLocal(): void {
  const path = join(process.cwd(), '.env.local');
  if (!existsSync(path)) return;

  const contents = readFileSync(path, 'utf8');
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
