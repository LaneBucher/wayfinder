// packages/core/src/events.ts
export type WayfinderEventMap = {
  'queue:count': { count: number };
  'sync:complete': {};
};

class WFBus extends EventTarget {
  on<K extends keyof WayfinderEventMap>(
    type: K,
    listener: (e: CustomEvent<WayfinderEventMap[K]>) => void
  ) { this.addEventListener(type, listener as EventListener); }

  off<K extends keyof WayfinderEventMap>(
    type: K,
    listener: (e: CustomEvent<WayfinderEventMap[K]>) => void
  ) { this.removeEventListener(type, listener as EventListener); }

  emit<K extends keyof WayfinderEventMap>(type: K, detail: WayfinderEventMap[K]) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }
}

export const bus = new WFBus();
