<script lang="ts">
  import type { Preset } from "$lib/types.js";

  let {
    presets,
    onSelect,
  }: {
    presets: Preset[];
    onSelect: (presetId: number) => void;
  } = $props();
</script>

{#if presets.length > 0}
  <div class="presets">
    <h3 class="section-title">Presets</h3>
    <div class="preset-grid">
      {#each presets as preset}
        <button
          class="preset-btn"
          disabled={!preset.contentItem}
          onclick={() => onSelect(Number(preset.id))}
        >
          <span class="preset-number">{preset.id}</span>
          <span class="preset-name">
            {preset.contentItem?.itemName ?? "Empty"}
          </span>
        </button>
      {/each}
    </div>
  </div>
{/if}

<style>
  .presets {
    padding: 1rem 1.5rem;
  }

  .section-title {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-secondary);
    margin-bottom: 0.75rem;
  }

  .preset-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
  }

  .preset-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.75rem 0.5rem;
    background: var(--color-surface);
    border-radius: var(--radius-sm);
    transition:
      background 0.15s,
      transform 0.1s;
  }

  .preset-btn:active:not(:disabled) {
    transform: scale(0.96);
  }

  .preset-btn:hover:not(:disabled) {
    background: var(--color-surface-hover);
  }

  .preset-number {
    font-size: 0.75rem;
    color: var(--color-accent);
    font-weight: 600;
  }

  .preset-name {
    font-size: 0.8rem;
    color: var(--color-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
</style>
