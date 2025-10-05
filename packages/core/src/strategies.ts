// packages/core/src/strategies.ts
import { idbGet, idbSet } from './storage';
import type { CacheStrategy } from './types';
import { parseTTL, upsertIndex } from './cacheIndex';
import { triggerHook } from './plugins';

function reqKey(url: string, init?: RequestInit) {
  const method = (init?.method || 'GET').toUpperCase();
  return `${method} ${url}`;
}

function headersToObject(h: Headers) {
  const obj: Record<string, string> = {};
  h.forEach((value, key) => { obj[key] = value; });
  return obj;
}

export async function cachedFetch(
  url: string,
  init: RequestInit = {},
  strategy: CacheStrategy = 'networkThenCache',
  opts?: { ttl?: string; meta?: Record<string, any> }
): Promise<Response> {
  const key = reqKey(url, init);
  const cached = await idbGet<any>('responses', key);
  const ttlMs = parseTTL(opts?.ttl);

  const write = async (r: Response) => {
    const body = await r.clone().arrayBuffer();
    const record = {
      ts: Date.now(),
      status: r.status,
      headers: headersToObject(r.headers),
      body
    };
    await idbSet('responses', key, record);
    const entry = {
      key,
      url,
      method: (init.method || 'GET').toUpperCase(),
      ts: Date.now(),
      ttlMs,
      meta: opts?.meta
    };
    await upsertIndex(entry);
    // 🔔 notify plugins
    await triggerHook('onCacheWrite', entry as any);
  };

  if (strategy === 'cacheFirst' && cached) {
    return new Response(cached.body, { status: cached.status, headers: cached.headers });
  }

  if (strategy === 'staleWhileRevalidate') {
    if (cached) {
      fetch(url, init).then(write).catch(() => {});
      return new Response(cached.body, { status: cached.status, headers: cached.headers });
    }
  }

  try {
    const r = await fetch(url, init);
    await write(r);
    return r;
  } catch (e) {
    if (cached) return new Response(cached.body, { status: cached.status, headers: cached.headers });
    throw e;
  }
}
