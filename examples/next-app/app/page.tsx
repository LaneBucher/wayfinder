'use client';

import { useEffect, useState } from 'react';
import { WayfinderProvider, useWayfinder } from '@wayfinder/next';

// Small floating status badge showing Online/Offline + Queue length
function StatusBadge() {
  const wf = useWayfinder();
  const [online, setOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [queue, setQueue] = useState<number>(0);

  // Track online/offline status
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

  // Subscribe to Wayfinder queue events
  useEffect(() => {
    if (!wf) return;
    const onCount = (e: any) => setQueue(e.detail.count ?? 0);
    const onComplete = () => setQueue(0);
    wf.events?.on?.('queue:count', onCount);
    wf.events?.on?.('sync:complete', onComplete);
    return () => {
      wf.events?.off?.('queue:count', onCount);
      wf.events?.off?.('sync:complete', onComplete);
    };
  }, [wf]);

  const bg = online ? '#10b981' : '#ef4444'; // green / red
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

// ✅ Demo component showing cached GETs and queued PUTs
function Demo() {
  const wf = useWayfinder(); // can be null initially
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    if (!wf) return; // wait until initialized
    (async () => {
      try {
        const data = await wf.get<any[]>(
          'https://jsonplaceholder.typicode.com/posts'
        );
        setPosts(data.slice(0, 5));
      } catch {
        const data = await wf.get<any[]>(
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
    if (!first) return;
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
      <button onClick={() => wf.processQueueNow()}>Process Queue</button>
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
    </main>
  );
}

// ✅ Wrap everything in WayfinderProvider
export default function Page() {
  return (
    <WayfinderProvider config={{ data: { defaultPolicy: 'networkThenCache' } }}>
      <Demo />
    </WayfinderProvider>
  );
}
