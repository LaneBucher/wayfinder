import { cachedFetch } from './strategies';
import { enqueueMutation, processQueue } from './queue';
import type { CacheStrategy, MutationEnvelope, WayfinderConfig } from './types';
import { bus } from './events';
import { clearAll, clearExpired, listIndex, purgeByPrefix } from './cacheIndex';
import { registerPlugins, triggerHook } from './plugins';

let _config: WayfinderConfig = {};
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

async function requestOneOffBGSync() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    if ('sync' in reg) {
      // @ts-expect-error missing types in some TS lib targets
      await reg.sync.register('wayfinder-sync');
    }
  } catch {}
}

async function requestPeriodicBGSync() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg: any = await navigator.serviceWorker.ready;
    if (reg?.periodicSync?.register) {
      await reg.periodicSync.register('wayfinder-periodic-sync', { minInterval: 5 * 60 * 1000 });
    }
  } catch {}
}

function startInPagePeriodicSync(tick: () => void) {
  const INTERVAL_MS = 5 * 60 * 1000;
  setInterval(() => {
    if (navigator.onLine && document.visibilityState === 'visible') {
      tick();
    }
  }, INTERVAL_MS);
}

export class Wayfinder {
  static async init(config: WayfinderConfig = {}) {
    _config = config;

    // build instance first so listeners can call instance.processQueueNow()
    const instance = new Wayfinder();

    // init plugins
    if (config.plugins?.length) {
      registerPlugins(config.plugins, {
        emit: (event, payload) => bus.dispatchEvent(new CustomEvent(event, { detail: payload })),
        getConfig: () => _config,
        now: () => Date.now(),
      });
    }

    // Service worker + messages
    if ('serviceWorker' in navigator) {
      try { await navigator.serviceWorker.register('/wayfinder-sw.js'); } catch {}
      navigator.serviceWorker.addEventListener('message', (e: MessageEvent) => {
        const msg = e.data as any;
        if (msg?.type === 'wayfinder-sync') {
          instance.processQueueNow().catch(() => {});
        }
      });
      requestPeriodicBGSync().catch(() => {});
    }

    // When we come back online, raise onOnline + processQueueNow (so onSync fires)
    window.addEventListener('online', async () => {
      await triggerHook('onOnline');
      instance.processQueueNow().catch(() => {});
    });

    // In-page periodic flush uses processQueueNow as well
    startInPagePeriodicSync(() => instance.processQueueNow().catch(() => {}));

    return instance;
  }

  // expose a read-only event bus
  get events() { return bus; }

  async get<T = any>(
    url: string,
    opts?: { strategy?: CacheStrategy; init?: RequestInit; ttl?: string; meta?: Record<string, any> }
  ): Promise<T> {
    const strategy = opts?.strategy ?? _config.data?.defaultPolicy ?? 'networkThenCache';
    await triggerHook('onFetch', url, opts?.init);
    const res = await cachedFetch(
      url,
      opts?.init,
      strategy,
      { ttl: opts?.ttl ?? _config.data?.defaultTTL, meta: opts?.meta }
    );
    const ct = res.headers.get('content-type') || '';
    return ct.includes('application/json') ? res.json() : (await res.text()) as unknown as T;
  }

  async mutate(url: string, init: RequestInit & { id?: string }) {
    const env: MutationEnvelope = {
      id: init?.id || uid(),
      url,
      method: (init.method || 'POST'),
      headers: (init.headers as Record<string,string>) || { 'content-type': 'application/json' },
      body: (init as any).body,
      ts: Date.now(),
      tries: 0,
    };

    try {
      const res = await fetch(url, { ...init, body: env.body });
      if (!res.ok) throw new Error('non-2xx');
      return res;
    } catch {
      await enqueueMutation(env);
      await triggerHook('onMutateQueue', env);
      await requestOneOffBGSync();
      return new Response(null, { status: 202, statusText: 'Queued offline' }) as any;
    }
  }

  async processQueueNow() {
    // run the low-level processor
    const list = await processQueue(); // returns MutationEnvelope[]
    // raise onSync for each successfully applied mutation
    for (const m of list) await triggerHook('onSync', m);
    return list;
  }

  // cache management API
  async listCache() { return listIndex(); }
  async clearCache() { return clearAll(); }
  async clearStale() { return clearExpired(); }
  async purgePrefix(prefix: string) { return purgeByPrefix(prefix); }
}
