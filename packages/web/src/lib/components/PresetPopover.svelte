<script lang="ts">
  import { storePreset } from "$lib/api.js";

  interface Props {
    id: string;
    selectedSpeaker: string | null;
    item: any;
    type: "playlist" | "track";
  }

  let { id, selectedSpeaker, item, type }: Props = $props();

  async function handlePresetClick(event: MouseEvent, slotNumber: number) {
    if (!selectedSpeaker) return;

    const contentItem = {
      source: "SPOTIFY",
      type: type === "playlist" ? "playlist" : "track",
      location: item.uri,
      sourceAccount: "",
      itemName: item.name,
      containerArt: type === "playlist" ? item.imageUrl : item.album?.imageUrl || "",
    };

    try {
      await storePreset(selectedSpeaker, slotNumber, contentItem);
      
      // Close the popover
      const popover = (event.target as HTMLElement).closest('[popover]') as HTMLElement;
      if (popover) {
        (popover as any).hidePopover();
      }
      
      alert(`Saved to preset ${slotNumber}!`);
    } catch (e) {
      console.error("Failed to save preset", e);
      alert("Failed to save preset");
    }
  }
</script>

<div {id} popover class="preset-popover">
  <div class="preset-grid">
    {#each [1, 2, 3, 4, 5, 6] as slot}
      <button 
        class="preset-slot-btn"
        onclick={(e) => handlePresetClick(e, slot)}
      >
        {slot}
      </button>
    {/each}
  </div>
</div>

<style>
  .preset-popover {
    padding: 1rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .preset-popover::backdrop {
    background: rgba(0, 0, 0, 0.4);
  }

  .preset-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
  }

  .preset-slot-btn {
    aspect-ratio: 1;
    padding: 0;
    background: var(--color-background);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: 1.2rem;
    font-weight: 600;
    transition: all 0.2s;
  }

  .preset-slot-btn:hover {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
    transform: scale(1.05);
  }
</style>
