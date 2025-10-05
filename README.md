# Wayfinder

**Wayfinder** is an offline-first data layer and caching runtime for Next.js apps.  
It provides seamless offline experiences, request queueing, background sync, and plugin-based extensibility.

**NOT STABLE.**

---

## Features

- **Offline-first fetching** using `networkThenCache`, `cacheFirst`, and `staleWhileRevalidate` strategies.
- **Automatic queueing of mutations** (e.g., POST/PUT/DELETE) when offline, synced when back online.
- **Background sync** support via Service Worker and in-page fallback timers.
- **Cache Inspector** for visual inspection and management of cached data.
- **Plugin system** for analytics, logging, or external data synchronization (e.g., Prisma, Supabase, etc.).
- **Service Worker** pre-caching and dynamic runtime caching of static assets and API responses.

---

## Packages

This monorepo contains the following packages:

| Package | Path | Description |
|----------|------|-------------|
| `@wayfinder/core` | `packages/core` | Core runtime, queue management, caching strategies, plugin API |
| `@wayfinder/next` | `packages/next` | React hooks + provider for Next.js integration |
| `examples/next-app` | `examples/next-app` | Demo application showcasing offline queueing, cache inspection, and plugins |

---

## Architecture Overview

Wayfinder consists of three main layers:

1. **Core Layer (`@wayfinder/core`)**
   - Defines the `Wayfinder` client class and caching/queue logic.
   - Handles network retries, mutation queueing, and service worker registration.
   - Includes background sync registration and plugin hooks.

2. **Next.js Layer (`@wayfinder/next`)**
   - Provides the `WayfinderProvider` and `useWayfinder()` hook.
   - Enables easy access to offline-aware APIs from React components.

3. **Example Layer**
   - Demonstrates offline caching, queued updates, event-based revalidation, and plugin examples.

---

## Getting Started

### Clone the repository

```bash
git clone https://github.com/LaneBucher/wayfinder.git
cd wayfinder
pnpm install
```

### Build all packages

```bash
pnpm -r run build
```

### Run the demo app

```bash
cd examples/next-app
pnpm dev
```

Then open your browser at [http://localhost:3000](http://localhost:3000).

---

## Testing

While the demo app is running:

1. Open **DevTools → Application → Service Workers** and confirm `wayfinder-sw.js` is active.
2. Click **Edit First Post** while offline.
   - The request will queue locally.
3. Reconnect your network.
   - The queue automatically syncs and clears.
4. Use the **Cache Inspector** panel (bottom-left) to inspect or clear cached entries.

---

## Plugin System

Plugins can hook into lifecycle events like:

```ts
export interface WayfinderPlugin {
  name: string;
  onInit?(): void;
  onFetch?(url: string): void;
  onMutateQueue?(env: MutationEnvelope): void;
  onSync?(env: MutationEnvelope): void;
  onOnline?(): void;
}
```

### Example: Logger Plugin

```ts
export function createLoggerPlugin() {
  return {
    name: 'LoggerPlugin',
    onInit() { console.log('[LoggerPlugin] initialized'); },
    onFetch(url) { console.log('[LoggerPlugin] fetch', url); },
    onMutateQueue(env) { console.log('[LoggerPlugin] queued', env.url); },
    onSync(env) { console.log('[LoggerPlugin] synced', env.url); },
    onOnline() { console.log('[LoggerPlugin] back online'); },
  };
}
```

### Example: Analytics Plugin

```ts
export function createAnalyticsPlugin() {
  return {
    name: 'AnalyticsPlugin',
    onFetch(url) { console.log('[AnalyticsPlugin] tracked', url); },
    onSync(env) { fetch('/api/analytics/event', { method: 'POST', body: JSON.stringify(env) }); }
  };
}
```

To register plugins:

```tsx
<WayfinderProvider
  config={{
    data: { defaultPolicy: 'networkThenCache' },
    plugins: [createLoggerPlugin(), createAnalyticsPlugin()]
  }}
>
  <App />
</WayfinderProvider>
```

---

## Build Commands

| Command | Description |
|----------|-------------|
| `pnpm -r run build` | Build all packages |
| `pnpm dev` | Run example app locally |
| `pnpm lint` | Run ESLint checks |

---

## Future Roadmap

- [ ] IndexedDB storage adapter for large datasets  
- [ ] Delta-based mutation merging  
- [ ] Plugin registry + dynamic loading  
- [ ] Prisma/SQLite sync plugin  
- [ ] Cross-tab broadcast updates  

---

## License

MIT License © 2025 Lane Bucher
