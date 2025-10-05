// packages/next/src/useWayfinder.ts
'use client';
import { useContext } from 'react';
import { WayfinderContext } from './provider';

type WFClient = {
  get<T>(url: string, opts?: any): Promise<T>;
  mutate(url: string, init: RequestInit & { id?: string }): Promise<Response>;
  processQueueNow(): Promise<void>;
  events?: {
    on(type: 'queue:count', listener: (e: CustomEvent<{ count: number }>) => void): void;
    off(type: 'queue:count', listener: (e: CustomEvent<{ count: number }>) => void): void;
    on(type: 'sync:complete', listener: (e: CustomEvent<{}>) => void): void;
    off(type: 'sync:complete', listener: (e: CustomEvent<{}>) => void): void;
  };
};

export function useWayfinder() {
  const { wf } = useContext(WayfinderContext);
  return (wf as WFClient) || null;
}
