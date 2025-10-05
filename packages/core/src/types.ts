// packages/core/src/types.ts

import type { WayfinderPlugin } from './plugins';

export type CacheStrategy =
  | 'cacheFirst'
  | 'staleWhileRevalidate'
  | 'networkThenCache';

export interface WayfinderConfig {
  appShell?: string[];
  routes?: Record<string, { strategy: CacheStrategy; maxAge?: string }>;
  data?: { defaultPolicy?: CacheStrategy; defaultTTL?: string };
  plugins?: WayfinderPlugin[]; // ✅ clean, typed, no runtime import
}

export interface MutationEnvelope {
  id: string;
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
  ts: number;
  tries: number;
}
