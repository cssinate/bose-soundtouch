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
      
      // Success feedback - could be improved with a toast notification
      const button = event.target as HTMLButtonElement;
      button.textContent = '✓';
      setTimeout(() => {
        button.textContent = String(slotNumber);
      }, 1000);
      
      // Close the popover after showing success
      const popover = document.getElementById(id) as HTMLElement;
      if (popover && 'hidePopover' in popover) {
        (popover as any).hidePopover();
      }
    } catch (e) {
      console.error("Failed to save preset", e);
      alert("Failed to save preset");
    }
  }
</script>

<div {id} popover="auto" class="preset-popover">
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
    padding: 0.75rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    margin: 0.25rem 0;
  }

  .preset-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
  }

  .preset-slot-btn {
    width: 48px;
    height: 48px;
    padding: 0;
    background: var(--color-background);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--color-text);
    transition: all 0.2s;
    cursor: pointer;
  }

  .preset-slot-btn:hover {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
    transform: scale(1.05);
  }

  .preset-slot-btn:active {
    transform: scale(0.95);
  }
</style>
