// packages/core/src/queue.ts
import { idbAll, idbDel, idbSet } from './storage';
import type { MutationEnvelope } from './types';
import { bus } from './events';

async function publishCount() {
  const list = await idbAll<MutationEnvelope>('mutations');
  bus.emit('queue:count', { count: list.length });
}

export async function enqueueMutation(env: MutationEnvelope) {
  await idbSet('mutations', env.id, env);
  await publishCount();
}

export async function processQueue() {
  const list = await idbAll<MutationEnvelope>('mutations');
  for (const m of list) {
    try {
      const res = await fetch(m.url, {
        method: m.method,
        headers: m.headers,
        body: m.body ? JSON.stringify(m.body) : undefined
      });
      if (res.ok) {
        await idbDel('mutations', m.id);
        await publishCount();
      }
    } catch {
      // stay queued
    }
  }
  const remaining = await idbAll<MutationEnvelope>('mutations');
  if (remaining.length === 0) bus.emit('sync:complete', {});
}
