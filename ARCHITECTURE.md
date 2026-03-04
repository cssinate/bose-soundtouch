# Plugin Architecture Summary

## Overview

The SoundTouch ecosystem uses a **convention-based, zero-configuration plugin architecture** where services are automatically discovered and integrated without any hardcoded references.

## Key Principles

### 1. Convention Over Configuration
- Server discovers plugins by config keys
- UI discovers services via API endpoint
- No manual registration required

### 2. Standard Interfaces
- All plugins implement `MusicServiceBrowserAPI`
- Generic function names: `search()`, not `searchSpotify()`
- Consistent data shapes across services

### 3. Dynamic Discovery
- Server: Scans config, imports plugins dynamically
- UI: Fetches enabled services, creates routes on-the-fly
- No hardcoded service names anywhere

### 4. Zero UI Changes for New Services
- Add plugin package → Add config → Service appears automatically
- Generic `MusicService` component works with any plugin
- Dynamic routes: `/services/{service-id}`

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Configuration (soundtouch.config.yaml)                      │
├─────────────────────────────────────────────────────────────┤
│ server: ...                                                  │
│ discovery: ...                                               │
│ spotify:                                                     │
│   clientId: xxx                                              │
│   clientSecret: xxx                                          │
│ deezer:                                                      │
│   appId: xxx                                                 │
│   appSecret: xxx                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Server Plugin Loader                                         │
├─────────────────────────────────────────────────────────────┤
│ 1. Read config keys                                          │
│ 2. For each non-core key:                                    │
│    - Try import(`@soundtouch/${key}`)                        │
│    - Fallback to relative path                               │
│ 3. Validate config with plugin.configSchema                  │
│ 4. Call plugin.createRoutes(app, context, config)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ REST API Endpoints                                           │
├─────────────────────────────────────────────────────────────┤
│ GET  /api/config/services  → { spotify: true, deezer: true } │
│ GET  /auth/spotify         → OAuth flow                      │
│ GET  /api/spotify/*        → Service endpoints               │
│ GET  /auth/deezer          → OAuth flow                      │
│ GET  /api/deezer/*         → Service endpoints               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ UI Layout Component                                          │
├─────────────────────────────────────────────────────────────┤
│ onMount:                                                     │
│   services = await getServiceStatus()                        │
│                                                              │
│ <nav>                                                        │
│   <a href="/">Speakers</a>                                   │
│   {#each services as service}                                │
│     <a href="/services/{service.id}">{service.name}</a>      │
│   {/each}                                                    │
│ </nav>                                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Dynamic Route: /services/[service]/+page.svelte             │
├─────────────────────────────────────────────────────────────┤
│ const serviceId = $page.params.service;                      │
│ const module = await import(`@soundtouch/${serviceId}`);     │
│ const service = module[serviceId];                           │
│                                                              │
│ <MusicService {service} />                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Generic MusicService Component                              │
├─────────────────────────────────────────────────────────────┤
│ Props: { service: MusicServicePlugin }                       │
│                                                              │
│ Uses:                                                        │
│  - service.metadata (id, name, authUrl, icon)                │
│  - service.api.getStatus()                                   │
│  - service.api.getPlaylists()                                │
│  - service.api.search()                                      │
│  - etc.                                                      │
│                                                              │
│ Works with ANY plugin that implements the interface          │
└─────────────────────────────────────────────────────────────┘
```

## Plugin Package Structure

```
@soundtouch/yourservice/
├── src/
│   ├── auth.ts              # OAuth2 implementation
│   ├── client.ts            # API client
│   ├── config.ts            # Zod schema
│   ├── server-plugin.ts     # ServerPlugin implementation
│   ├── browser-api.ts       # MusicServiceBrowserAPI + metadata
│   ├── types.ts             # Service-specific types
│   └── index.ts             # Public exports
├── package.json
└── tsconfig.json
```

## Required Exports

Each plugin must export:

```typescript
// server-plugin.ts
export const plugin: ServerPlugin = {
  name: "yourservice",
  configSchema: yourServiceConfigSchema,
  createRoutes: async (app, context, config) => { /* ... */ }
};

// browser-api.ts
export const api: MusicServiceBrowserAPI = {
  getStatus: async () => { /* ... */ },
  getMe: async () => { /* ... */ },
  search: async (query) => { /* ... */ },
  getPlaylists: async () => { /* ... */ },
  getPlaylistTracks: async (id) => { /* ... */ },
  playUri: async (uri, deviceId?) => { /* ... */ },
  playTrack: async (uri, deviceId?) => { /* ... */ },
};

export const yourservice: MusicServicePlugin = {
  metadata: {
    id: "yourservice",
    name: "Your Service",
    authUrl: "/auth/yourservice",
    icon: "🎵"
  },
  api
};

// index.ts
export { plugin } from "./server-plugin.js";
export { yourServiceConfigSchema } from "./config.js";
export * from "./browser-api.js";
export * from "./types.js";
```

## Adding a New Service

To add a new music service to the ecosystem:

1. **Create plugin package**: `packages/yourservice/`
2. **Implement interfaces**: `ServerPlugin`, `MusicServiceBrowserAPI`, `MusicServicePlugin`
3. **Add configuration**: Add `yourservice:` section to `soundtouch.config.yaml`
4. **Done!** Service automatically appears in UI navigation

No changes needed to:
- ❌ Server code (auto-discovers)
- ❌ UI layout (auto-generates nav)
- ❌ UI routes (dynamic route handles it)
- ❌ UI components (generic component works for all)

## Benefits

| Aspect | Benefit |
|--------|---------|
| **Developer Experience** | Add services without touching core code |
| **Type Safety** | TypeScript enforces interface compliance |
| **Bundle Size** | Lazy loading, only load what's used |
| **User Experience** | Consistent UI across all services |
| **Maintainability** | Changes isolated to plugin packages |
| **Scalability** | Add unlimited services without refactoring |
| **Testing** | Test plugins independently |

## Examples in This Repo

- `@soundtouch/spotify` - Full reference implementation
- See `PLUGIN_GUIDE.md` for detailed walkthrough

## Future Services

With this architecture, adding these services is straightforward:

- **Deezer** - `@soundtouch/deezer`
- **Apple Music** - `@soundtouch/apple-music`
- **Tidal** - `@soundtouch/tidal`
- **YouTube Music** - `@soundtouch/youtube-music`
- **Pandora** - `@soundtouch/pandora`
- **Custom Service** - Any OAuth2 music API

Each takes ~1-2 hours to implement, with zero changes to core packages.
