# SoundTouch

A modular ecosystem for controlling Bose SoundTouch speakers and integrating streaming services, built for both developers and self-hosters.

## Background

On January 7, 2026, [Bose announced](https://www.bose.com/soundtouch-end-of-life) that cloud support for SoundTouch products will end on May 6, 2026. After this date:

**What will continue to work:**

- Streaming via Bluetooth, AirPlay, Spotify Connect, and AUX
- Setting up and configuring your system
- Remote control features (play, pause, skip, volume)
- Grouping multiple speakers together

**What will stop working:**

- Presets (preset buttons and app presets)
- Browsing music services from the SoundTouch app

As part of this transition, Bose released their SoundTouch API Documentation to enable independent developers to create their own SoundTouch-compatible tools.

This project provides a complete, self-hostable replacement: a web interface for controlling your speakers and browsing your music services, all running on your local network.

## Packages

| Package | Description |
|---------|-------------|
| `@soundtouch/core` | Shared types, configuration schema, logger, and base error classes |
| `@soundtouch/api` | TypeScript client for the SoundTouch local REST API |
| `@soundtouch/discovery` | SSDP-based auto-discovery of speakers on the local network |
| `@soundtouch/spotify` | Spotify OAuth2 integration and Web API client |
| `@soundtouch/server` | Fastify backend with REST API, WebSocket push, and SQLite storage |
| `@soundtouch/web` | SvelteKit web interface with dark theme and mobile-first design |

Developers can install only the packages they need. Self-hosters can run everything via Docker.

## Quick Start (Docker)

The fastest way to get running:

```bash
cd docker
cp .env.example .env
# Edit .env with your Spotify credentials (optional)
docker compose up
```

Open `http://localhost:3000` in your browser.

### Development with Docker (Hot Reload)

For development with automatic reload when you make changes:

```bash
cd docker
cp .env.example .env
# Edit .env with your settings
docker compose -f docker-compose.dev.yml up
```

This mounts your source code as a volume and runs in dev mode with hot reload.

> **Note:** The Docker container uses host networking by default for SSDP speaker discovery. If you can't use host networking, set `DISCOVERY_ENABLED=false` and configure `SPEAKER_HOSTS` manually.

## Quick Start (Development)

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start the server in dev mode
pnpm --filter @soundtouch/server dev

# In another terminal, start the web UI in dev mode
pnpm --filter @soundtouch/web dev
```

## Configuration

### Docker Configuration

When running via Docker, configure the server using environment variables in the `.env` file (see `docker/.env.example`). All settings are available as environment variables.

**Common Docker setup:**

```bash
cd docker
cp .env.example .env
# Edit .env with your settings
```

**Important for WSL2/Windows users:** If SSDP discovery doesn't work (common with WSL2's virtual networking), disable it and manually specify your speaker IPs:

```bash
DISCOVERY_ENABLED=false
SPEAKER_HOSTS=192.168.1.100:8090,192.168.1.101:8090
```

### Local Development Configuration

When running locally (non-Docker), you can use either environment variables or a `soundtouch.config.yaml` file in the project root. The YAML config provides a more readable format for complex setups. See `soundtouch.config.example.yaml` for the full schema.

Environment variables take precedence over the config file.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `HOST` | Server bind address | `0.0.0.0` |
| `DATA_DIR` | SQLite database directory | `./data` |
| `LOG_LEVEL` | Log level (`debug`, `info`, `warn`, `error`, `silent`) | `info` |
| `PIN` | Optional PIN to protect the web UI | _(none)_ |
| `SPEAKER_HOSTS` | Comma-separated speaker addresses (`ip:port`) | _(none)_ |
| `DISCOVERY_ENABLED` | Enable SSDP speaker discovery | `true` |
| `SPOTIFY_CLIENT_ID` | Spotify app client ID | _(none)_ |
| `SPOTIFY_CLIENT_SECRET` | Spotify app client secret | _(none)_ |
| `SPOTIFY_REDIRECT_URI` | Spotify OAuth callback URL | `http://127.0.0.1:3000/auth/spotify/callback` |

### Config File (Local Development Only)

For local development, you can use `soundtouch.config.yaml` instead of environment variables. See `soundtouch.config.example.yaml` for the full schema.

## Using Individual Packages

### API Client Only

```bash
npm install @soundtouch/api
```

```typescript
import { SoundTouch } from "@soundtouch/api";

const speaker = new SoundTouch("192.168.1.100");

const info = await speaker.getInfo();
console.log(`Connected to: ${info.name}`);

await speaker.play();
await speaker.setVolume(30);

const nowPlaying = await speaker.getNowPlaying();
console.log(`Playing: ${nowPlaying.track} by ${nowPlaying.artist}`);
```

### Speaker Discovery

```bash
npm install @soundtouch/discovery
```

```typescript
import { SpeakerScanner } from "@soundtouch/discovery";

const scanner = new SpeakerScanner();

scanner.on("discovered", (speaker) => {
  console.log(`Found: ${speaker.name} at ${speaker.host}`);
});

await scanner.start();
```

### Spotify Integration

```bash
npm install @soundtouch/spotify
```

```typescript
import { SpotifyAuth, SpotifyClient } from "@soundtouch/spotify";

const auth = new SpotifyAuth({
  clientId: "your-client-id",
  clientSecret: "your-client-secret",
  redirectUri: "http://127.0.0.1:3000/auth/spotify/callback",
});

// After OAuth flow...
const client = new SpotifyClient(accessToken);
const results = await client.search("bohemian rhapsody");
const devices = await client.getDevices();
```

## API Reference

### SoundTouch Class (`@soundtouch/api`)

```typescript
new SoundTouch(host: string, port?: number, timeout?: number)
```

| Method | Description |
|--------|-------------|
| `getInfo()` | Get device information |
| `getCapabilities()` | Get device capabilities |
| `setName(name)` | Set device name |
| `getNowPlaying()` | Get current playback state |
| `getSources()` | Get available sources |
| `selectSource(source, account?)` | Select a source |
| `getVolume()` | Get volume state |
| `setVolume(level)` | Set volume (0-100) |
| `mute()` / `unmute()` | Mute/unmute |
| `volumeUp()` / `volumeDown()` | Adjust volume |
| `getPresets()` | Get preset slots |
| `selectPreset(presetId)` | Select preset (1-6) |
| `play()` / `pause()` / `stop()` | Playback control |
| `playPause()` | Toggle play/pause |
| `nextTrack()` / `previousTrack()` | Track navigation |
| `getBass()` / `setBass(level)` | Bass control |
| `getTone()` | Get tone settings |
| `sendKey(key)` | Send raw key press |

## Requirements

- Node.js 18.0.0 or higher
- pnpm 9+ (for development)
- Docker (for self-hosting)

## Contributing

When adding a new service package (e.g., `@soundtouch/deezer`):

1. Create the package in `packages/` following the existing structure
2. Export a `plugin` object conforming to the `ServerPlugin` interface from `@soundtouch/core`
3. Add a `COPY` line for the package's dist folder in the Dockerfile production stage:
   ```dockerfile
   COPY --from=build /app/packages/deezer/dist packages/deezer/dist
   ```

The package.json files are automatically picked up via glob patterns, so you only need to add one line for the dist folder.

## Credit

This package is derived from the work done by [captivus](https://github.com/captivus) in creating a [Python library](https://github.com/captivus/bose-soundtouch)

## License

MIT License

---

Not affiliated with, endorsed, sponsored, or approved by Bose. Bose and SoundTouch are trademarks of Bose Corporation.
