import { cachedFetch } from './strategies';
import { enqueueMutation, processQueue } from './queue';
import type { CacheStrategy, MutationEnvelope, WayfinderConfig } from './types';

let _config: WayfinderConfig = {};
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export class Wayfinder {
  static async init(config: WayfinderConfig = {}) {
    _config = config;
    if ('serviceWorker' in navigator) {
      try { await navigator.serviceWorker.register('/wayfinder-sw.js'); } catch {}
      window.addEventListener('online', () => processQueue());
    }
    return new Wayfinder();
  }

  async get<T = any>(url: string, opts?: { strategy?: CacheStrategy, init?: RequestInit }): Promise<T> {
    const strategy = opts?.strategy ?? _config.data?.defaultPolicy ?? 'networkThenCache';
    const res = await cachedFetch(url, opts?.init, strategy);
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return res.json() as Promise<T>;
    return (await res.text()) as unknown as T;
  }

  async mutate(url: string, init: RequestInit & { id?: string }) {
    const env: MutationEnvelope = {
      id: init?.id || uid(),
      url,
      method: (init.method || 'POST'),
      headers: (init.headers as Record<string,string>) || { 'content-type': 'application/json' },
      body: (init as any).body,
      ts: Date.now(),
      tries: 0
    };

    try {
      const res = await fetch(url, { ...init, body: env.body });
      if (!res.ok) throw new Error('non-2xx');
      return res;
    } catch {
      await enqueueMutation(env);
      return new Response(null, { status: 202, statusText: 'Queued offline' }) as any;
    }
  }

  async processQueueNow() { return processQueue(); }
}
