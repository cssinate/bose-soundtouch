# bose-soundtouch

A JavaScript/TypeScript library for controlling Bose SoundTouch speakers via the local REST API.

## Background

On January 7, 2026, Bose announced that cloud support for SoundTouch products will end on May 6, 2026. After this date:

**What will continue to work:**

- Streaming via Bluetooth, AirPlay, Spotify Connect, and AUX
- Setting up and configuring your system
- Remote control features (play, pause, skip, volume)
- Grouping multiple speakers together

**What will stop working:**

- Presets (preset buttons and app presets)
- Browsing music services from the SoundTouch app

As part of this transition, Bose released their SoundTouch API Documentation to enable independent developers to create their own SoundTouch-compatible tools.

This library provides a clean, TypeScript-friendly interface to control SoundTouch speakers over your local network, ensuring your speakers remain fully functional even after cloud services end.

## Installation

```bash
npm install bose-soundtouch
```

or

```bash
yarn add bose-soundtouch
```

## Quick Start

```typescript
import { SoundTouch } from "bose-soundtouch";

// Connect to a speaker by IP address
const speaker = new SoundTouch("192.168.1.100");

// Get device info
const info = await speaker.getInfo();
console.log(`Connected to: ${info.name} (${info.type})`);

// Control playback
await speaker.play();
await speaker.setVolume(30);

// Check what's playing
const nowPlaying = await speaker.getNowPlaying();
console.log(`Playing: ${nowPlaying.track} by ${nowPlaying.artist}`);
```

## Demo Script

A comprehensive demo script is included to test the library against a real device:

```bash
npm run demo 192.168.1.100
```

or

```bash
ts-node demo.ts 192.168.1.100
```

The demo walks through device info, capabilities, sources, presets, volume control, mute, and playback controls.

## Features

- Control playback (play, pause, stop, next/previous track)
- Adjust volume and mute
- Select presets (1-6)
- Select sources (AUX, Bluetooth, etc.)
- Get now playing information
- Control bass and tone settings
- Full TypeScript support with type definitions
- Error handling with custom error classes

## Usage Examples

### Playback Control

```typescript
import { SoundTouch } from "bose-soundtouch";

const speaker = new SoundTouch("192.168.1.100");

await speaker.play();
await speaker.pause();
await speaker.playPause(); // Toggle
await speaker.stop();
await speaker.nextTrack();
await speaker.previousTrack();
```

### Volume Control

```typescript
import { SoundTouch } from "bose-soundtouch";

const speaker = new SoundTouch("192.168.1.100");

// Get current volume
const volume = await speaker.getVolume();
console.log(`Volume: ${volume.actualvolume}, Muted: ${volume.muteenabled}`);

// Set volume (0-100)
await speaker.setVolume(50);

// Mute/unmute
await speaker.mute();
await speaker.unmute();

// Volume up/down buttons
await speaker.volumeUp();
await speaker.volumeDown();
```

### Presets

```typescript
import { SoundTouch } from "bose-soundtouch";

const speaker = new SoundTouch("192.168.1.100");

// Get all presets
const presets = await speaker.getPresets();
for (const preset of presets.preset) {
  if (preset.contentItem) {
    console.log(`Preset ${preset.id}: ${preset.contentItem.itemName}`);
  }
}

// Select a preset
await speaker.selectPreset(1);
```

### Now Playing

```typescript
import { SoundTouch, PlayStatus } from "bose-soundtouch";

const speaker = new SoundTouch("192.168.1.100");

const now = await speaker.getNowPlaying();

console.log(`Source: ${now.source}`);
console.log(`Track: ${now.track}`);
console.log(`Artist: ${now.artist}`);
console.log(`Album: ${now.album}`);

if (now.playStatus === PlayStatus.PLAY_STATE) {
  console.log("Currently playing");
} else if (now.playStatus === PlayStatus.PAUSE_STATE) {
  console.log("Paused");
}
```

### Source Selection

```typescript
import { SoundTouch } from "bose-soundtouch";

const speaker = new SoundTouch("192.168.1.100");

// List available sources
const sources = await speaker.getSources();
for (const source of sources.sourceItem) {
  console.log(`${source.source}: ${source.status}`);
}

// Select a source
await speaker.selectSource("AUX", "AUX");
await speaker.selectSource("BLUETOOTH");
```

### Device Information

```typescript
import { SoundTouch } from "bose-soundtouch";

const speaker = new SoundTouch("192.168.1.100");

const info = await speaker.getInfo();

console.log(`Name: ${info.name}`);
console.log(`Type: ${info.type}`);
console.log(`Device ID: ${info.deviceID}`);

for (const net of info.networkInfo) {
  console.log(`  ${net.type}: ${net.ipAddress}`);
}
```

### Raw Key Press

For advanced use cases, you can send raw key presses:

```typescript
import { SoundTouch, KeyValue } from "bose-soundtouch";

const speaker = new SoundTouch("192.168.1.100");

// Using enum
await speaker.sendKey(KeyValue.THUMBS_UP);

// Using string
await speaker.sendKey("POWER");
```

### Error Handling

```typescript
import {
  SoundTouch,
  ConnectionError,
  TimeoutError,
  ApiError,
} from "bose-soundtouch";

try {
  const speaker = new SoundTouch("192.168.1.100", 8090, 5.0);
  await speaker.setVolume(50);
} catch (error) {
  if (error instanceof ConnectionError) {
    console.error("Could not connect to speaker");
  } else if (error instanceof TimeoutError) {
    console.error("Request timed out");
  } else if (error instanceof ApiError) {
    console.error(`API error: ${error.errorName} (code ${error.errorCode})`);
  } else {
    console.error("Unknown error:", error);
  }
}
```

## API Reference

### SoundTouch Class

```typescript
new SoundTouch(
  host: string,        // IP address or hostname
  port?: number,      // HTTP port (default: 8090)
  timeout?: number    // Request timeout in seconds (default: 10.0)
)
```

### Methods

| Method                             | Description                |
| ---------------------------------- | -------------------------- |
| `getInfo()`                        | Get device information     |
| `getCapabilities()`                | Get device capabilities    |
| `setName(name: string)`            | Set device name            |
| `getNowPlaying()`                  | Get current playback state |
| `getSources()`                     | Get available sources      |
| `selectSource(source, account?)`   | Select a source            |
| `getVolume()`                      | Get volume state           |
| `setVolume(level: number)`         | Set volume (0-100)         |
| `mute()` / `unmute()`              | Mute/unmute                |
| `volumeUp()` / `volumeDown()`      | Adjust volume              |
| `getPresets()`                     | Get preset slots           |
| `selectPreset(presetId: number)`   | Select preset (1-6)        |
| `play()` / `pause()` / `stop()`    | Playback control           |
| `playPause()`                      | Toggle play/pause          |
| `nextTrack()` / `previousTrack()`  | Track navigation           |
| `getBass()` / `setBass(level)`     | Bass control               |
| `getTone()`                        | Get tone settings          |
| `sendKey(key: KeyValue \| string)` | Send raw key press         |

### Types

The library exports TypeScript types and enums:

- `DeviceInfo` - Device information structure
- `Capabilities` - Device capabilities
- `Presets` - Preset slots
- `Sources` - Available sources
- `Volume` - Volume state
- `NowPlaying` - Current playback information
- `Bass` - Bass settings
- `Tone` - Tone settings (bass and treble)
- `PlayStatus` - Playback status enum
- `KeyValue` - Key press enum

### Error Classes

- `ConnectionError` - Network connection errors
- `TimeoutError` - Request timeout errors
- `ApiError` - API error responses

## Requirements

- Node.js 18.0.0 or higher
- TypeScript 5.0+ (for TypeScript projects)

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in watch mode
npm run dev

# Run demo
npm run demo <ip-address>
```

## License

MIT License

---

Not affiliated with, endorsed, sponsored, or approved by Bose. Bose and SoundTouch are trademarks of Bose Corporation.
