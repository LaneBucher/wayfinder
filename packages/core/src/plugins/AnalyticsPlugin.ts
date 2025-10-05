import type { WayfinderPlugin } from '../plugins';

export function createAnalyticsPlugin(): WayfinderPlugin {
  return {
    name: 'AnalyticsPlugin',
    onFetch(url: string) { console.log('[AnalyticsPlugin] fetch tracked:', url); },
    onOnline() {
      try {
        navigator.sendBeacon?.('/analytics/event', JSON.stringify({ type: 'online', ts: Date.now() }));
      } catch {}
    },
  };
}

export const AnalyticsPlugin = createAnalyticsPlugin; // back-compat alias