// packages/core/src/plugins/PrismaSyncPlugin.ts
import type { WayfinderPlugin } from '../plugins';
import type { MutationEnvelope } from '../types';

export type PrismaSyncConfig = {
  endpoint: string;              // e.g. '/api/sync'
  batchSize?: number;            // default 50
  defaultTTL?: string;           // e.g. '5m' for GET cache
};

export function createPrismaSyncPlugin(cfg: PrismaSyncConfig): WayfinderPlugin {
  const batch = cfg.batchSize ?? 50;

  return {
    name: 'PrismaSyncPlugin',

    // Tag fetches for better cache control (optional)
    onFetch(url: string) {
      // For now, no-op; future: attach headers or meta
      // console.log('[PrismaSyncPlugin] fetch', url);
    },

    // When a mutation is queued, we could trigger a soft “soon” flush,
    // but we already have background sync. Leaving as log for visibility.
    onMutateQueue(env: MutationEnvelope) {
      console.log('[PrismaSyncPlugin] queued mutation', env.method, env.url);
    },

    // When core finishes a sync for a mutation (processQueueNow), optionally batch send to backend
    async onSync(env: MutationEnvelope) {
      // In this simple demo we post each mutation directly; you can evolve to true batching
      try {
        const res = await fetch(cfg.endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ mutations: [env] })
        });
        if (!res.ok) {
          console.warn('[PrismaSyncPlugin] server sync failed', res.status);
        } else {
          // server ACK; nothing else to do
        }
      } catch (e) {
        console.warn('[PrismaSyncPlugin] server sync error', e);
      }
    },

    // Optionally respond to cache writes (e.g., warm relations, prefetch)
    onCacheWrite(entry) {
      // Future: inspect entry.url & meta to prefetch related records
      // console.log('[PrismaSyncPlugin] cache write', entry.url);
    },

    onOnline() {
      // Could trigger an extra flush here if desired
      // console.log('[PrismaSyncPlugin] back online');
    }
  };
}
