'use client';
import React, { useEffect, useMemo, useState } from 'react';
import type { WayfinderConfig } from '@wayfinder/core';
import { Wayfinder } from '@wayfinder/core';

export const WayfinderContext = React.createContext<{ wf: any | null }>({ wf: null });

export function WayfinderProvider({ children, config }: { children: React.ReactNode, config?: WayfinderConfig }) {
  const [wf, setWf] = useState<any>(null);
  useEffect(() => { (async () => setWf(await Wayfinder.init(config)))(); }, [JSON.stringify(config)]);
  const value = useMemo(() => ({ wf }), [wf]);
  return <WayfinderContext.Provider value={value}>{children}</WayfinderContext.Provider>;
}
