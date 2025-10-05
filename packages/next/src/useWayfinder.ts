'use client';
import { useContext } from 'react';
import { WayfinderContext } from './provider';
import type { MutationEnvelope } from '@wayfinder/core';

type WFClient = {
  // core data APIs
  get<T>(url: string, opts?: any): Promise<T>;
  mutate(url: string, init: RequestInit & { id?: string }): Promise<Response>;
  processQueueNow(): Promise<MutationEnvelope[]>; // ← match core return type

  // cache management APIs
  listCache(): Promise<any[]>;
  clearCache(): Promise<void>;
  clearStale(): Promise<void>;
  purgePrefix(prefix: string): Promise<void>;

  // event bus (optional at init)
  events?: {
    on(type: 'queue:count', listener: (e: CustomEvent<{ count: number }>) => void): void;
    off(type: 'queue:count', listener: (e: CustomEvent<{ count: number }>) => void): void;
    on(type: 'sync:complete', listener: (e: CustomEvent<{}>) => void): void;
    off(type: 'sync:complete', listener: (e: CustomEvent<{}>) => void): void;
  };
};

export function useWayfinder(): WFClient | null {
  const { wf } = useContext(WayfinderContext);
  // Cast via unknown to satisfy TS since Wayfinder is structurally compatible with WFClient
  return (wf as unknown as WFClient) ?? null;
}
