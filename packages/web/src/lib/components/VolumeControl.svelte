<script lang="ts">
  import type { Volume } from "$lib/types.js";

  let {
    volume,
    onVolumeChange,
    onMuteToggle,
  }: {
    volume: Volume | null;
    onVolumeChange: (level: number) => void;
    onMuteToggle: () => void;
  } = $props();

  let level = $derived(volume?.actualvolume ?? 0);
  let isMuted = $derived(volume?.muteenabled ?? false);

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    onVolumeChange(Number(target.value));
  }
</script>

<div class="volume">
  <button
    class="mute-btn"
    class:muted={isMuted}
    onclick={onMuteToggle}
    aria-label={isMuted ? "Unmute" : "Mute"}
  >
    {#if isMuted || level === 0}
      <span class="material-symbols-rounded">volume_off</span>
    {:else if level < 50}
      <span class="material-symbols-rounded">volume_down</span>
    {:else}
      <span class="material-symbols-rounded">volume_up</span>
    {/if}
  </button>

  <input
    type="range"
    min="0"
    max="100"
    value={level}
    oninput={handleInput}
    class="slider"
    aria-label="Volume"
  />

  <span class="level">{level}</span>
</div>

<style>
  .volume {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.5rem;
  }

  .mute-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    color: var(--color-text);
    transition: color 0.15s;
    flex-shrink: 0;
  }

  .mute-btn span {
    font-size: 24px;
  }

  .mute-btn.muted {
    color: var(--color-danger);
  }

  .slider {
    flex: 1;
    height: 6px;
    appearance: none;
    background: var(--color-border);
    border-radius: 3px;
    outline: none;
  }

  .slider::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--color-accent);
    cursor: pointer;
  }

  .level {
    width: 2rem;
    text-align: right;
    font-size: 0.85rem;
    color: var(--color-text-secondary);
    flex-shrink: 0;
  }
</style>
