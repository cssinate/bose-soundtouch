<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import SpeakerList from "$lib/components/SpeakerList.svelte";
  import NowPlayingDisplay from "$lib/components/NowPlaying.svelte";
  import PlaybackControls from "$lib/components/PlaybackControls.svelte";
  import VolumeControl from "$lib/components/VolumeControl.svelte";
  import PresetList from "$lib/components/PresetList.svelte";
  import {
    getSpeakers,
    getNowPlaying,
    getVolume,
    setVolume,
    sendPlaybackAction,
    getPresets,
    selectPreset,
  } from "$lib/api.js";
  import { SpeakerSocket } from "$lib/websocket.js";
  import { selectedSpeaker } from "$lib/stores.js";
  import type { SpeakerInfo, NowPlaying, Volume, Preset } from "$lib/types.js";

  let speakers: SpeakerInfo[] = $state([]);
  let selectedId: string | null = $state(null);
  let nowPlaying: NowPlaying | null = $state(null);
  let volume: Volume | null = $state(null);
  let presets: Preset[] = $state([]);
  let error: string | null = $state(null);

  const socket = new SpeakerSocket();
  let unsubState: (() => void) | null = null;

  onMount(async () => {
    try {
      speakers = await getSpeakers();
      if (speakers.length > 0) {
        selectSpeaker(speakers[0].id);
      }
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to load speakers";
    }

    socket.connect();
    unsubState = socket.onState((speakerId, state) => {
      if (speakerId === selectedId) {
        nowPlaying = state.nowPlaying;
        volume = state.volume;
      }
    });
  });

  onDestroy(() => {
    unsubState?.();
    socket.disconnect();
  });

  async function selectSpeaker(id: string) {
    if (selectedId) socket.unsubscribe(selectedId);

    selectedId = id;
    selectedSpeaker.set(id); // Update global store
    socket.subscribe(id);

    try {
      const [np, vol, p] = await Promise.all([
        getNowPlaying(id),
        getVolume(id),
        getPresets(id),
      ]);
      nowPlaying = np;
      volume = vol;
      presets = p.preset ?? [];
    } catch {
      nowPlaying = null;
      volume = null;
      presets = [];
    }
  }

  async function handleAction(action: string) {
    if (!selectedId) return;
    await sendPlaybackAction(selectedId, action);
  }

  async function handleVolumeChange(level: number) {
    if (!selectedId) return;
    await setVolume(selectedId, level);
  }

  async function handleMuteToggle() {
    if (!selectedId) return;
    const action = volume?.muteenabled ? "unmute" : "mute";
    await sendPlaybackAction(selectedId, action);
  }

  async function handlePresetSelect(presetId: number) {
    if (!selectedId) return;
    await selectPreset(selectedId, presetId);
  }
</script>

{#if error}
  <div class="error">
    <p>{error}</p>
    <button onclick={() => location.reload()}>Retry</button>
  </div>
{:else}
  <SpeakerList {speakers} {selectedId} onSelect={selectSpeaker} />

  {#if selectedId}
    <NowPlayingDisplay {nowPlaying} />
    <PlaybackControls {nowPlaying} onAction={handleAction} />
    <VolumeControl
      {volume}
      onVolumeChange={handleVolumeChange}
      onMuteToggle={handleMuteToggle}
    />
    <PresetList {presets} onSelect={handlePresetSelect} />
  {/if}
{/if}

<style>
  .error {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 3rem 1.5rem;
    color: var(--color-danger);
    text-align: center;
  }

  .error button {
    padding: 0.5rem 1.5rem;
    background: var(--color-surface);
    border-radius: var(--radius-sm);
    color: var(--color-text);
    font-size: 0.9rem;
  }

  .error button:hover {
    background: var(--color-surface-hover);
  }
</style>
