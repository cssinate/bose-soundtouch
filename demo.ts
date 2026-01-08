#!/usr/bin/env ts-node

/**
 * Demo script for testing the SoundTouch library
 * Usage: ts-node demo.ts <ip-address>
 */

import { SoundTouch, PlayStatus } from "./src";

const IP_ADDRESS = process.argv[2] || "192.168.1.100";

async function runDemo() {
  console.log(`Connecting to SoundTouch speaker at ${IP_ADDRESS}...\n`);

  const speaker = new SoundTouch(IP_ADDRESS);

  try {
    // Device Info
    console.log("=== Device Information ===");
    const info = await speaker.getInfo();
    console.log(`Name: ${info.name}`);
    console.log(`Type: ${info.type}`);
    console.log(`Device ID: ${info.deviceID}`);
    console.log("Network Info:");
    info.networkInfo.forEach((net) => {
      console.log(`  ${net.type}: ${net.ipAddress} (${net.macAddress})`);
    });
    console.log();

    // Capabilities
    console.log("=== Capabilities ===");
    const capabilities = await speaker.getCapabilities();
    capabilities.capabilities.forEach((cap) => {
      console.log(`  ${cap.name}: ${cap.value}`);
    });
    console.log();

    // Sources
    console.log("=== Available Sources ===");
    const sources = await speaker.getSources();
    sources.sourceItem.forEach((source) => {
      console.log(`  ${source.source}${source.sourceAccount ? ` (${source.sourceAccount})` : ""}: ${source.status}`);
    });
    console.log();

    // Presets
    console.log("=== Presets ===");
    const presets = await speaker.getPresets();
    presets.preset.forEach((preset) => {
      if (preset.contentItem) {
        console.log(`  Preset ${preset.id}: ${preset.contentItem.itemName || preset.contentItem.source}`);
      } else {
        console.log(`  Preset ${preset.id}: (empty)`);
      }
    });
    console.log();

    // Volume
    console.log("=== Volume ===");
    const volume = await speaker.getVolume();
    console.log(`  Current: ${volume.actualvolume}`);
    console.log(`  Target: ${volume.targetvolume}`);
    console.log(`  Muted: ${volume.muteenabled}`);
    console.log();

    // Now Playing
    console.log("=== Now Playing ===");
    const nowPlaying = await speaker.getNowPlaying();
    console.log(`  Source: ${nowPlaying.source}`);
    if (nowPlaying.track) {
      console.log(`  Track: ${nowPlaying.track}`);
    }
    if (nowPlaying.artist) {
      console.log(`  Artist: ${nowPlaying.artist}`);
    }
    if (nowPlaying.album) {
      console.log(`  Album: ${nowPlaying.album}`);
    }
    if (nowPlaying.playStatus) {
      console.log(`  Status: ${nowPlaying.playStatus}`);
    }
    console.log();

    // Bass
    console.log("=== Bass ===");
    try {
      const bass = await speaker.getBass();
      console.log(`  Current: ${bass.actualbass}`);
      console.log(`  Target: ${bass.targetbass}`);
      console.log(`  Available: ${bass.available ?? "unknown"}`);
    } catch (error) {
      console.log("  Bass control not available on this device");
    }
    console.log();

    console.log("Demo completed successfully!");
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
      if (error.stack) {
        console.error(error.stack);
      }
    } else {
      console.error("Unknown error:", error);
    }
    process.exit(1);
  }
}

runDemo();
