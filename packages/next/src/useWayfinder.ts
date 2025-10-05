'use client';
import { useContext } from 'react';
import { WayfinderContext } from './provider';

export function useWayfinder() {
  const { wf } = useContext(WayfinderContext);
  // Return null until Wayfinder.init() completes
  return (wf as {
    get<T>(url: string, opts?: any): Promise<T>;
    mutate(url: string, init: RequestInit & { id?: string }): Promise<Response>;
    processQueueNow(): Promise<void>;
  }) || null;
}