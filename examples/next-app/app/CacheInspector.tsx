'use client';
import { useEffect, useState } from 'react';
import { useWayfinder } from '@wayfinder/next';

type Entry = {
  key: string;
  url: string;
  method: string;
  ts: number;
  ttlMs?: number;
  meta?: Record<string, any>;
};

export default function CacheInspector() {
  const wf = useWayfinder();
  const [rows, setRows] = useState<Entry[]>([]);

  async function load() {
    if (!wf) return;
    const list = await wf.listCache();
    setRows(list);
  }

  useEffect(() => {
    if (!wf) return;
    load();
  }, [wf]);

  return (
    <div
      style={{
        position: 'fixed',
        left: 12,
        bottom: 12,
        padding: 12,
        borderRadius: 8,
        background: 'white',
        color: '#111',
        border: '1px solid #e5e7eb',
        width: 420,
        fontFamily: 'system-ui',
        boxShadow: '0 4px 14px rgba(0,0,0,.1)',
        maxHeight: '40vh',
        overflow: 'auto',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <strong>Cache Inspector</strong>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => wf?.clearStale().then(() => load())}
            disabled={!wf}
          >
            Clear stale
          </button>
          <button
            onClick={() => wf?.clearCache().then(() => load())}
            disabled={!wf}
          >
            Clear all
          </button>
          <button onClick={() => wf && load()} disabled={!wf}>
            Refresh
          </button>
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
            <th style={{ padding: '4px 6px' }}>Method</th>
            <th style={{ padding: '4px 6px' }}>URL</th>
            <th style={{ padding: '4px 6px' }}>Age</th>
            <th style={{ padding: '4px 6px' }}>TTL</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const ageSec = Math.floor((Date.now() - r.ts) / 1000);
            return (
              <tr key={r.key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '4px 6px', whiteSpace: 'nowrap' }}>{r.method}</td>
                <td
                  style={{
                    padding: '4px 6px',
                    maxWidth: 220,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={r.url}
                >
                  {r.url}
                </td>
                <td style={{ padding: '4px 6px' }}>{ageSec}s</td>
                <td style={{ padding: '4px 6px' }}>
                  {r.ttlMs ? `${Math.round(r.ttlMs / 1000)}s` : '—'}
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} style={{ padding: 8, color: '#6b7280' }}>
                No cache entries yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
