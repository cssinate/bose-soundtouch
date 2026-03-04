<script lang="ts">
  import type { NowPlaying } from "$lib/types.js";

  let {
    nowPlaying,
    onAction,
  }: {
    nowPlaying: NowPlaying | null;
    onAction: (action: string) => void;
  } = $props();

  let isPlaying = $derived(nowPlaying?.playStatus === "PLAY_STATE");
</script>

<div class="controls">
  <button
    class="control-btn"
    disabled={!nowPlaying?.skipPreviousEnabled}
    onclick={() => onAction("previous")}
    aria-label="Previous track"
  >
    <span class="material-symbols-rounded">skip_previous</span>
  </button>

  <button
    class="control-btn play-btn"
    onclick={() => onAction(isPlaying ? "pause" : "play")}
    aria-label={isPlaying ? "Pause" : "Play"}
  >
    {#if isPlaying}
      <span class="material-symbols-rounded filled">pause_circle</span>
    {:else}
      <span class="material-symbols-rounded filled">play_circle</span>
    {/if}
  </button>

  <button
    class="control-btn"
    disabled={!nowPlaying?.skipEnabled}
    onclick={() => onAction("next")}
    aria-label="Next track"
  >
    <span class="material-symbols-rounded">skip_next</span>
  </button>
</div>

<style>
  .controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    padding: 1rem;
  }

  .control-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--color-surface);
    color: var(--color-text);
    transition:
      background 0.15s,
      transform 0.1s;
  }

  .control-btn span {
    font-size: 28px;
  }

  .control-btn:active:not(:disabled) {
    transform: scale(0.93);
  }

  .control-btn:hover:not(:disabled) {
    background: var(--color-surface-hover);
  }

  .play-btn {
    width: 72px;
    height: 72px;
    background: var(--color-accent);
    color: #000;
  }

  .play-btn span {
    font-size: 48px;
  }

  .play-btn:hover:not(:disabled) {
    background: var(--color-accent-hover);
  }
</style>
