import { idbAll, idbDel, idbSet } from './storage';
import type { MutationEnvelope } from './types';

export async function enqueueMutation(env: MutationEnvelope) {
  await idbSet('mutations', env.id, env);
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
      if (res.ok) await idbDel('mutations', m.id);
    } catch { /* keep queued */ }
  }
}
