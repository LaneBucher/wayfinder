import type { WayfinderPlugin } from '../plugins';

export function createLoggerPlugin(): WayfinderPlugin {
  return {
    name: 'LoggerPlugin',
    onInit() { console.log('[LoggerPlugin] initialized'); },
    onFetch(url) { console.log('[LoggerPlugin] fetch', url); },
    onCacheWrite(entry: any) { console.log('[LoggerPlugin] cache write', entry?.url); },
    onMutateQueue(env: any) { console.log('[LoggerPlugin] queued mutation', env?.url); },
    onSync(env: any) { console.log('[LoggerPlugin] synced mutation', env?.url); },
    onOnline() { console.log('[LoggerPlugin] back online'); },
  };
}

export const LoggerPlugin = createLoggerPlugin; // back-compat alias