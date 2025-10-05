'use client';

import { useEffect, useState } from 'react';
import { WayfinderProvider, useWayfinder } from '@wayfinder/next';

function Demo() {
  const wf = useWayfinder();                 // can be null initially
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    if (!wf) return;                         // wait until initialized
    (async () => {
      try {
        const data = await wf.get<any[]>('https://jsonplaceholder.typicode.com/posts');
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
    return <main style={{ padding: 24 }}><h1>Initializing offline runtime…</h1></main>;
  }

  async function editFirst() {
    const first = posts[0];
    if (!first) return;
    const res = await wf.mutate(`https://jsonplaceholder.typicode.com/posts/${first.id}`, {
      method: 'PUT',
      body: { ...first, title: 'Edited offline maybe' },
      headers: { 'content-type': 'application/json' }
    });
    alert(res.status === 202 ? 'Queued offline' : 'Updated');
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Wayfinder Offline Demo</h1>
      <button onClick={() => wf.processQueueNow()}>Process Queue</button>
      <button onClick={editFirst} style={{ marginLeft: 12 }}>Edit First Post</button>
      <ul>{posts.map(p => <li key={p.id}><b>{p.id}.</b> {p.title}</li>)}</ul>
      <p>Go offline and refresh — content should still render from cache. Edits queue.</p>
    </main>
  );
}

export default function Page() {
  return (
    <WayfinderProvider config={{ data: { defaultPolicy: 'networkThenCache' } }}>
      <Demo />
    </WayfinderProvider>
  );
}