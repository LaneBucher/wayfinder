import type { MutationEnvelope } from './types';
import type { CacheIndexEntry } from './cacheIndex';

export interface WayfinderPluginContext {
  emit: (event: string, payload?: any) => void;
  getConfig: () => any;
  now: () => number;
}

export interface WayfinderPlugin {
  name: string;
  onInit?(ctx: WayfinderPluginContext): void | Promise<void>;
  onFetch?(url: string, init?: RequestInit): void | Promise<void>;
  onCacheWrite?(entry: CacheIndexEntry): void | Promise<void>;
  onMutateQueue?(env: MutationEnvelope): void | Promise<void>;
  onSync?(mutation: MutationEnvelope): void | Promise<void>;
  onOnline?(): void | Promise<void>;
}

let _plugins: WayfinderPlugin[] = [];
let _ctx: WayfinderPluginContext;

export function registerPlugins(plugins: WayfinderPlugin[], ctx: WayfinderPluginContext) {
  _plugins = plugins;
  _ctx = ctx;
  for (const p of _plugins) {
    try {
      p.onInit?.(_ctx);
    } catch (err) {
      console.warn(`[Wayfinder] Plugin ${p.name} init failed:`, err);
    }
  }
}

// Trigger a specific hook on all registered plugins, in order.
export async function triggerHook(hook: keyof WayfinderPlugin, ...args: any[]): Promise<void> {
  for (const p of _plugins) {
    const fn = (p as any)[hook];
    if (typeof fn === 'function') {
      try {
        await fn.apply(p, args);
      } catch (err) {
        console.warn(`[Wayfinder] Plugin ${p.name} ${hook} failed:`, err);
      }
    }
  }
}

export function getPlugins() {
  return _plugins;
}
