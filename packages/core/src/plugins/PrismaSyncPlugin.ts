import type { WayfinderPlugin } from '../plugins';
import type { MutationEnvelope } from '../types';

export type PrismaSyncConfig = {
  endpoint: string;              
  batchSize?: number; // default 50
  defaultTTL?: string;           
};

export function createPrismaSyncPlugin(cfg: PrismaSyncConfig): WayfinderPlugin {
  const batch = cfg.batchSize ?? 50;

  return {
    name: 'PrismaSyncPlugin',

    // Tag fetches for better cache control
    onFetch(url: string) {
        // could inspect URL to set custom metadata in future
    },

    // When core queues a mutation (POST/PUT/DELETE), log or notify
    onMutateQueue(env: MutationEnvelope) {
      console.log('[PrismaSyncPlugin] queued mutation', env.method, env.url);
    },

    // When core finishes a sync for a mutation (processQueueNow), optionally batch send to backend
    async onSync(env: MutationEnvelope) {
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

    // respond to cache writes (e.g., warm relations, prefetch)
    onCacheWrite(entry) {
      // console.log('[PrismaSyncPlugin] cache write', entry.url);
    },

    onOnline() {
      // console.log('[PrismaSyncPlugin] back online');
    }
  };
}
