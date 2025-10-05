'use client';

import { useEffect, useState } from 'react';
import { WayfinderProvider, useWayfinder } from '@wayfinder/next';
import CacheInspector from './CacheInspector';
plugins: [
  createLoggerPlugin(),
  createAnalyticsPlugin(),
  createPrismaSyncPlugin({ endpoint: '/api/sync', defaultTTL: '5m' }),
]

function StatusBadge() {
  const wf = useWayfinder();
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [queue, setQueue] = useState(0);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  useEffect(() => {
    if (!wf?.events) return;
    const onCount = (e: any) => setQueue(e.detail.count ?? 0);
    const onComplete = () => setQueue(0);
    wf.events.on('queue:count', onCount);
    wf.events.on('sync:complete', onComplete);
    return () => {
      wf.events?.off('queue:count', onCount);
      wf.events?.off('sync:complete', onComplete);
    };
  }, [wf]);

  const bg = online ? '#10b981' : '#ef4444';
  const label = online ? 'Online' : 'Offline';

  return (
    <div
      style={{
        position: 'fixed',
        right: 12,
        bottom: 12,
        background: bg,
        color: 'white',
        borderRadius: 8,
        padding: '8px 10px',
        fontFamily: 'system-ui',
        boxShadow: '0 4px 14px rgba(0,0,0,.2)',
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        zIndex: 9999,
      }}
    >
      <span>{label}</span>
      <span
        style={{
          background: 'rgba(0,0,0,.2)',
          padding: '2px 6px',
          borderRadius: 6,
        }}
      >
        queue: {queue}
      </span>
    </div>
  );
}

function Demo() {
  const wf = useWayfinder();
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    if (!wf) return;
    (async () => {
      try {
        const data = await wf.get<any[]>(
          'https://jsonplaceholder.typicode.com/posts'
        );
        setPosts(data.slice(0, 5));
      } catch {
        const data = await wf?.get<any[]>(
          'https://jsonplaceholder.typicode.com/posts',
          { strategy: 'cacheFirst' }
        );
        setPosts((data || []).slice(0, 5));
      }
    })();
  }, [wf]);

  if (!wf) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Initializing offline runtime…</h1>
      </main>
    );
  }

  async function editFirst() {
    const first = posts[0];
    if (!first || !wf) return;
    const res = await wf.mutate(
      `https://jsonplaceholder.typicode.com/posts/${first.id}`,
      {
        method: 'PUT',
        body: { ...first, title: 'Edited offline maybe' },
        headers: { 'content-type': 'application/json' },
      }
    );
    alert(res.status === 202 ? 'Queued offline' : 'Updated');
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Wayfinder Offline Demo</h1>
      <button onClick={() => wf?.processQueueNow()}>Process Queue</button>
      <button onClick={editFirst} style={{ marginLeft: 12 }}>
        Edit First Post
      </button>
      <ul>
        {posts.map((p) => (
          <li key={p.id}>
            <b>{p.id}.</b> {p.title}
          </li>
        ))}
      </ul>
      <p>
        Go offline and refresh — content should still render from cache. Edits
        queue.
      </p>
      <StatusBadge />
      <CacheInspector />
    </main>
  );
}

function createLoggerPlugin() {
  return {
    name: 'LoggerPlugin',
    onInit() { console.log('[LoggerPlugin] initialized'); },
    onFetch(url: string) { console.log('[LoggerPlugin] fetch', url); },
    onMutateQueue(env: any) { console.log('[LoggerPlugin] queued', env.url); },
    onSync(env: any) { console.log('[LoggerPlugin] synced', env.url); },
    onOnline() { console.log('[LoggerPlugin] back online'); },
  };
}

function createAnalyticsPlugin() {
  return {
    name: 'AnalyticsPlugin',
    onFetch(url: string) { console.log('[AnalyticsPlugin] fetch tracked:', url); },
    onOnline() {
      try { navigator.sendBeacon?.('/analytics/event', JSON.stringify({ type: 'online', ts: Date.now() })); } catch {}
    },
  };
}

function createPrismaSyncPlugin(cfg: { endpoint: string; batchSize?: number; defaultTTL?: string }) {
  const batch = cfg.batchSize ?? 50;
  return {
    name: 'PrismaSyncPlugin',
    onMutateQueue(env: any) {
      console.log('[PrismaSyncPlugin] queued', env?.method, env?.url);
    },
    async onSync(env: any) {
      try {
        const res = await fetch(cfg.endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ mutations: [env] }),
        });
        if (!res.ok) console.warn('[PrismaSyncPlugin] server sync failed', res.status);
      } catch (e) {
        console.warn('[PrismaSyncPlugin] server sync error', e);
      }
    },
  };
}


export default function Page() {
  return (
    <WayfinderProvider
      config={{
        data: { defaultPolicy: 'networkThenCache' },
        plugins: [
          createLoggerPlugin(),
          createAnalyticsPlugin(),
          createPrismaSyncPlugin({ endpoint: '/api/sync', defaultTTL: '5m' }),
        ],
      }}
    >
      <Demo />
    </WayfinderProvider>
  );
}