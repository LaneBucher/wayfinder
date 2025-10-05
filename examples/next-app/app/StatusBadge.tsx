'use client';
import { useEffect, useState } from 'react';
import { useWayfinder } from '@wayfinder/next';

export default function StatusBadge() {
  const wf = useWayfinder();
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [queue, setQueue] = useState(0);

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

  // Safely attach Wayfinder event listeners
  useEffect(() => {
    if (!wf?.events) return;
    const onCount = (e: CustomEvent<{ count: number }>) =>
      setQueue(e.detail.count ?? 0);
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
