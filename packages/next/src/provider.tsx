'use client';
import React, { createContext, useEffect, useState } from 'react';
import { Wayfinder } from '@wayfinder/core';
import type { WayfinderConfig } from '@wayfinder/core'; // make sure this is here!

export const WayfinderContext = createContext<{ wf: Wayfinder | null }>({ wf: null });

export function WayfinderProvider({ children, config }: { children: React.ReactNode; config?: WayfinderConfig }) {
  const [wf, setWf] = useState<Wayfinder | null>(null);

  useEffect(() => {
    (async () => {
      const instance = await Wayfinder.init(config);
      setWf(instance);
    })();
  }, [config]);

  return <WayfinderContext.Provider value={{ wf }}>{children}</WayfinderContext.Provider>;
}
