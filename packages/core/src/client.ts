// packages/core/src/client.ts
import { cachedFetch } from './strategies';
import { enqueueMutation, processQueue } from './queue';
import type { CacheStrategy, MutationEnvelope, WayfinderConfig } from './types';
import { bus } from './events';

let _config: WayfinderConfig = {};
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

async function requestOneOffBGSync() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    if ('sync' in reg) {
      // @ts-expect-error: TS doesn't know about reg.sync in some lib versions
      await reg.sync.register('wayfinder-sync');
    }
  } catch { /* ignore */ }
}

async function requestPeriodicBGSync() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg: any = await navigator.serviceWorker.ready;
    const hasPeriodic = reg && reg.periodicSync && typeof reg.periodicSync.register === 'function';
    if (hasPeriodic) {
      // Try ~5 minutes; browsers may clamp
      await reg.periodicSync.register('wayfinder-periodic-sync', { minInterval: 5 * 60 * 1000 });
    }
  } catch { /* ignore */ }
}

function startInPagePeriodicSync() {
  // Fallback: in-page interval (runs only while a tab is open)
  const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  setInterval(() => {
    if (typeof navigator !== 'undefined' && navigator.onLine && document.visibilityState === 'visible') {
      processQueue().catch(() => {});
    }
  }, INTERVAL_MS);
}

export class Wayfinder {
  static async init(config: WayfinderConfig = {}) {
    _config = config;

    // Register SW & hook messages to trigger queue processing
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/wayfinder-sw.js');
      } catch { /* ignore */ }

      // When SW says "sync", process the queue
      navigator.serviceWorker.addEventListener('message', (e: MessageEvent) => {
        const msg = (e?.data || {}) as any;
        if (msg?.type === 'wayfinder-sync') {
          processQueue().catch(() => {});
        }
      });

      // Try setting up periodic background sync (where supported)
      requestPeriodicBGSync().catch(() => {});
    }

    // Flush whenever we come back online
    window.addEventListener('online', () => { processQueue().catch(() => {}); });

    // In-page periodic flush as a fallback
    startInPagePeriodicSync();

    return new Wayfinder();
  }

  // expose a read-only event bus
  get events() { return bus; }

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
      // Queue offline and request a background sync
      await enqueueMutation(env);
      await requestOneOffBGSync();
      return new Response(null, { status: 202, statusText: 'Queued offline' }) as any;
    }
  }

  async processQueueNow() { return processQueue(); }
}
