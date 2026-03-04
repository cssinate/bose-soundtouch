<script lang="ts">
  import type { SpeakerInfo } from "$lib/types.js";

  let {
    speakers,
    selectedId,
    onSelect,
  }: {
    speakers: SpeakerInfo[];
    selectedId: string | null;
    onSelect: (id: string) => void;
  } = $props();
</script>

<div class="speaker-list">
  {#if speakers.length === 0}
    <div class="empty">
      <p>Searching for speakers...</p>
      <div class="spinner"></div>
    </div>
  {:else}
    {#each speakers as speaker}
      <button
        class="speaker-card"
        class:selected={speaker.id === selectedId}
        onclick={() => onSelect(speaker.id)}
      >
        <span class="speaker-name">{speaker.name}</span>
        <span class="speaker-host">{speaker.host}</span>
      </button>
    {/each}
  {/if}
</div>

<style>
  .speaker-list {
    display: flex;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .speaker-list::-webkit-scrollbar {
    display: none;
  }

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 2rem;
    color: var(--color-text-secondary);
    font-size: 0.9rem;
  }

  .spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--color-border);
    border-top-color: var(--color-accent);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .speaker-card {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    padding: 0.75rem 1.25rem;
    background: var(--color-surface);
    border: 2px solid transparent;
    border-radius: var(--radius-sm);
    white-space: nowrap;
    transition:
      border-color 0.15s,
      background 0.15s;
  }

  .speaker-card:hover {
    background: var(--color-surface-hover);
  }

  .speaker-card.selected {
    border-color: var(--color-accent);
  }

  .speaker-name {
    font-weight: 600;
    font-size: 0.95rem;
  }

  .speaker-host {
    font-size: 0.75rem;
    color: var(--color-text-secondary);
  }
</style>
