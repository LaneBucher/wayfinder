export type CacheStrategy = 'cacheFirst' | 'staleWhileRevalidate' | 'networkThenCache';

export interface WayfinderConfig {
  appShell?: string[];
  routes?: Record<string, { strategy: CacheStrategy; maxAge?: string }>;
  data?: { defaultPolicy?: CacheStrategy };
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
