// packages/core/src/strategies.ts
import { idbGet, idbSet } from './storage';
import type { CacheStrategy } from './types';

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
  strategy: CacheStrategy = 'networkThenCache'
): Promise<Response> {
  const key = reqKey(url, init);
  const cached = await idbGet<any>('responses', key);

  if (strategy === 'cacheFirst' && cached) {
    return new Response(cached.body, { status: cached.status, headers: cached.headers });
  }

  if (strategy === 'staleWhileRevalidate') {
    if (cached) {
      // Refresh in background
      fetch(url, init)
        .then(async (r) => {
          const body = await r.clone().arrayBuffer();
          await idbSet('responses', key, {
            ts: Date.now(),
            status: r.status,
            headers: headersToObject(r.headers),
            body
          });
        })
        .catch(() => {});
      return new Response(cached.body, { status: cached.status, headers: cached.headers });
    }
    // fall through to network if nothing cached
  }

  // networkThenCache (or fallback)
  try {
    const r = await fetch(url, init);
    const body = await r.clone().arrayBuffer();
    await idbSet('responses', key, {
      ts: Date.now(),
      status: r.status,
      headers: headersToObject(r.headers),
      body
    });
    return r;
  } catch (e) {
    if (cached) return new Response(cached.body, { status: cached.status, headers: cached.headers });
    throw e;
  }
}
