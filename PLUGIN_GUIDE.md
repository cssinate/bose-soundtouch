# Music Service Plugin Guide

This guide explains how to create a new music service plugin (like Spotify, Deezer, Apple Music, etc.) for the SoundTouch ecosystem.

## Architecture Overview

The SoundTouch ecosystem uses a **convention-based plugin architecture** where:

- **Server automatically discovers plugins** based on configuration keys
- **UI dynamically loads plugins** and creates routes at runtime
- **All plugins follow a standard interface** with consistent function names
- **No hardcoded service names** in the core application

Music service plugins consist of three main parts:

1. **Server Plugin** - Handles OAuth, API requests, and exposes REST endpoints
2. **Browser API** - Client-side functions that call the server endpoints
3. **Metadata** - Service information for UI discovery and display

## Required Interfaces

All music service plugins must implement the standard interfaces defined in `@soundtouch/core`:

### ServerPlugin Interface

```typescript
interface ServerPlugin {
  name: string;
  configSchema: z.ZodTypeAny;
  createRoutes(
    app: unknown,
    context: PluginContext,
    config: unknown,
  ): Promise<void>;
}
```

### MusicServiceBrowserAPI Interface

**IMPORTANT**: All function names must be generic (e.g., `search`, `getPlaylists`), NOT service-specific (e.g., `searchSpotify`, `getSpotifyPlaylists`). This allows the UI to work with any service plugin.

```typescript
interface MusicServiceBrowserAPI {
  getStatus(): Promise<{ authenticated: boolean; expiresAt: number | null }>;
  getMe(): Promise<unknown>;
  search(query: string): Promise<unknown>;
  getPlaylists(): Promise<unknown[]>;
  getPlaylistTracks(playlistId: string): Promise<unknown[]>;
  playUri(uri: string, deviceId?: string): Promise<void>;
  playTrack(uri: string, deviceId?: string): Promise<void>;
}
```

### MusicServiceMetadata Interface

```typescript
interface MusicServiceMetadata {
  id: string;           // e.g., "spotify", "deezer"
  name: string;         // e.g., "Spotify", "Deezer"
  authUrl: string;      // e.g., "/auth/spotify"
  icon?: string;        // e.g., "🎵", "🎶"
}
```

### MusicServicePlugin Interface

```typescript
interface MusicServicePlugin {
  metadata: MusicServiceMetadata;
  api: MusicServiceBrowserAPI;
}
```

## Implementation Steps

### 1. Create Package Structure

```
packages/your-service/
├── src/
│   ├── auth.ts           # OAuth2 flow
│   ├── client.ts         # Service API client
│   ├── config.ts         # Zod schema for config
│   ├── server-plugin.ts  # Fastify routes
│   ├── browser-api.ts    # Client-side API functions
│   ├── types.ts          # Service-specific types
│   └── index.ts          # Public exports
├── package.json
└── tsconfig.json
```

### 2. Define Configuration Schema

```typescript
// src/config.ts
import { z } from "zod";

export const yourServiceConfigSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  redirectUri: z.string().url().default("http://127.0.0.1:3000/auth/yourservice/callback"),
});

export type YourServiceConfig = z.infer<typeof yourServiceConfigSchema>;
```

### 3. Implement Server Plugin

```typescript
// src/server-plugin.ts
import type { ServerPlugin, PluginContext } from "@soundtouch/core";
import { yourServiceConfigSchema } from "./config.js";

export const plugin: ServerPlugin = {
  name: "yourservice",
  configSchema: yourServiceConfigSchema,

  async createRoutes(app: any, context: PluginContext, config: any) {
    const { logger, tokenStore } = context;
    const cfg = config as YourServiceConfig;

    // OAuth routes
    app.get("/auth/yourservice", async (req: any, reply: any) => {
      // Start OAuth flow
    });

    app.get("/auth/yourservice/callback", async (req: any, reply: any) => {
      // Handle OAuth callback, save tokens
    });

    // API routes
    app.get("/api/yourservice/status", async (req: any, reply: any) => {
      // Check auth status
    });

    app.get("/api/yourservice/playlists", async (req: any, reply: any) => {
      // Get user playlists
    });

    // ... more routes
  },
};
```

### 4. Implement Browser API

**Critical**: Use standard function names, not service-specific ones!

```typescript
// src/browser-api.ts
import type { MusicServiceBrowserAPI, MusicServicePlugin } from "@soundtouch/core";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json();
}

// ✅ CORRECT: Generic function names
export async function getStatus() {
  return request("/api/yourservice/status");
}

export async function getMe() {
  return request("/api/yourservice/me");
}

export async function search(query: string) {
  return request(`/api/yourservice/search?q=${encodeURIComponent(query)}`);
}

export async function getPlaylists() {
  return request("/api/yourservice/playlists");
}

export async function getPlaylistTracks(playlistId: string) {
  return request(`/api/yourservice/playlists/${playlistId}/tracks`);
}

export async function playUri(uri: string, deviceId?: string) {
  await request("/api/yourservice/player/play", {
    method: "POST",
    body: JSON.stringify({ context_uri: uri, device_id: deviceId }),
  });
}

export async function playTrack(uri: string, deviceId?: string) {
  await request("/api/yourservice/player/play", {
    method: "POST",
    body: JSON.stringify({ uris: [uri], device_id: deviceId }),
  });
}

// API implementation
export const api: MusicServiceBrowserAPI = {
  getStatus,
  getMe,
  search,
  getPlaylists,
  getPlaylistTracks,
  playUri,
  playTrack,
};

// Complete plugin export for UI discovery
export const yourservice: MusicServicePlugin = {
  metadata: {
    id: "yourservice",
    name: "Your Service",
    authUrl: "/auth/yourservice",
    icon: "🎵",
  },
  api,
};
```

❌ **INCORRECT**: Service-specific names
```typescript
// DON'T DO THIS
export async function getYourServiceStatus() { ... }
export async function searchYourService() { ... }
```

### 5. Export Public API

```typescript
// src/index.ts
export { plugin } from "./server-plugin.js";
export { yourServiceConfigSchema } from "./config.js";
export type { YourServiceConfig } from "./config.js";
export * from "./browser-api.js";  // Exports api, yourservice, and all functions
export * from "./types.js";
```

## How Plugin Discovery Works

### Server-Side

1. Server reads `soundtouch.config.yaml`
2. For each config key (except `server`, `discovery`, etc.):
   - Tries to import `@soundtouch/{key}`
   - Falls back to relative path for local dev
3. Validates config against plugin's schema
4. Calls `plugin.createRoutes()` to register endpoints

### Client-Side (UI)

1. UI fetches `/api/config/services` to see what's enabled
2. Dynamically creates routes: `/services/{service-id}`
3. When user navigates, dynamically imports `@soundtouch/{service-id}`
4. Loads the plugin's `metadata` and `api` objects
5. Renders generic `MusicService` component with the plugin

**Result**: No hardcoded service names anywhere! Add Deezer by just:
1. Creating `@soundtouch/deezer` package
2. Adding `deezer:` config section
3. UI automatically discovers and loads it

### 6. UI Integration (Automatic!)

With this architecture, **you don't need to modify the web package at all**. The UI automatically:

- Discovers enabled services from `/api/config/services`
- Creates navigation links dynamically
- Loads plugins on-demand when accessed
- Renders them with the generic `MusicService` component

However, if you want the web package to include your service by default (for better DX), add it as an optional dependency:

```json
{
  "dependencies": {
    "@soundtouch/yourservice": "workspace:*"
  }
}
```

## Plugin Loading

The server automatically loads plugins based on configuration:

1. Reads `soundtouch.config.yaml`
2. For each config key (except core keys like `server`, `discovery`, etc.):
   - Attempts to import `@soundtouch/{key}` (for production npm packages)
   - Falls back to relative path `../../{key}/dist/index.js` (for local development)
3. Validates config against plugin's schema
4. Calls `createRoutes()` to register endpoints

The UI automatically discovers plugins:

1. Fetches `/api/config/services` on mount
2. For each enabled service, creates navigation and route
3. Routes are dynamic: `/services/{service-id}`
4. Plugin is lazy-loaded when user navigates to it

## Configuration

Add your service config to `soundtouch.config.yaml`:

```yaml
yourservice:
  clientId: "your-client-id"
  clientSecret: "your-client-secret"
  redirectUri: "http://127.0.0.1:3000/auth/yourservice/callback"
```

Or use environment variables:

```env
YOURSERVICE_CLIENT_ID=your-client-id
YOURSERVICE_CLIENT_SECRET=your-client-secret
YOURSERVICE_REDIRECT_URI=http://127.0.0.1:3000/auth/yourservice/callback"
```

## Example: Spotify Plugin

See `packages/spotify/` for a complete reference implementation.

## Benefits of This Architecture

✅ **Zero UI Changes**: Add new services without modifying the web package
✅ **Type-Safe**: TypeScript ensures plugins conform to interfaces  
✅ **Lazy Loading**: Plugins load on-demand, reducing bundle size
✅ **Consistent UX**: All services use the same UI component
✅ **Developer Friendly**: Clear conventions, excellent DX
✅ **Scalable**: Add unlimited services without coupling

## Best Practices

- **Function Names**: Use generic names (`search`, not `searchSpotify`)
- **Export Pattern**: Export both individual functions AND the complete plugin object
- **Type Safety**: Leverage TypeScript interfaces
- **OAuth**: Use provided `tokenStore` for token persistence
- **Logging**: Use provided `logger` for consistent output
- **Error Handling**: Provide clear, actionable error messages
- **Documentation**: Document service-specific quirks or requirements
- **Testing**: Test both server routes and browser API functions
