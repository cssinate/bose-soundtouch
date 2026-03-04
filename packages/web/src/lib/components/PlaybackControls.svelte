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
    <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
      <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
    </svg>
  </button>

  <button
    class="control-btn play-btn"
    onclick={() => onAction(isPlaying ? "pause" : "play")}
    aria-label={isPlaying ? "Pause" : "Play"}
  >
    {#if isPlaying}
      <svg viewBox="0 0 24 24" fill="currentColor" width="36" height="36">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
      </svg>
    {:else}
      <svg viewBox="0 0 24 24" fill="currentColor" width="36" height="36">
        <path d="M8 5v14l11-7z" />
      </svg>
    {/if}
  </button>

  <button
    class="control-btn"
    disabled={!nowPlaying?.skipEnabled}
    onclick={() => onAction("next")}
    aria-label="Next track"
  >
    <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
    </svg>
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

  .play-btn:hover:not(:disabled) {
    background: var(--color-accent-hover);
  }
</style>
