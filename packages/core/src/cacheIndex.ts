import { idbAll, idbDel, idbGet, idbSet } from './storage';

export interface CacheIndexEntry {
  key: string;           // e.g., "GET https://..."
  url: string;
  method: string;        // GET/HEAD
  ts: number;            // cached at (ms)
  ttlMs?: number;        // optional time-to-live
  meta?: Record<string, any>;
}

export function parseTTL(input?: string): number | undefined {
  if (!input) return undefined;
  const m = String(input).trim().match(/^(\d+)\s*(ms|s|m|h|d)$/i);
  if (!m) return undefined;
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  const mult = unit === 'ms' ? 1 : unit === 's' ? 1e3 : unit === 'm' ? 6e4 : unit === 'h' ? 36e5 : 864e5;
  return n * mult;
}

export async function upsertIndex(entry: CacheIndexEntry) {
  await idbSet('index', entry.key, entry);
}

export async function removeIndex(key: string) {
  await idbDel('index', key);
}

export async function listIndex(): Promise<CacheIndexEntry[]> {
  const all = await idbAll<CacheIndexEntry>('index');
  // newest first
  return all.sort((a, b) => b.ts - a.ts);
}

export async function clearExpired(now = Date.now()) {
  const items = await listIndex();
  for (const e of items) {
    if (e.ttlMs && now - e.ts > e.ttlMs) {
      await idbDel('responses', e.key);
      await removeIndex(e.key);
    }
  }
}

export async function clearAll() {
  const items = await listIndex();
  for (const e of items) {
    await idbDel('responses', e.key);
    await removeIndex(e.key);
  }
}

export async function purgeByPrefix(prefix: string) {
  const items = await listIndex();
  for (const e of items) {
    if (e.url.startsWith(prefix)) {
      await idbDel('responses', e.key);
      await removeIndex(e.key);
    }
  }
}

export async function getIndex(key: string) {
  return idbGet<CacheIndexEntry>('index', key);
}
