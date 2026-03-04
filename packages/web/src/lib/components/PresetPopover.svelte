<script lang="ts">
  import { storePreset } from "$lib/api.js";

  interface Props {
    contentItem: any;
    speakerId: string | null;
    triggerId: string;
  }

  let { contentItem, speakerId, triggerId }: Props = $props();
  const popoverId = `popover-${triggerId}`;

  async function handlePresetClick(event: MouseEvent, slotNumber: number) {
    if (!speakerId) return;

    const item = {
      source: "SPOTIFY",
      type: "uri",
      location: contentItem.uri,
      sourceAccount: "",
      itemName: contentItem.name,
      containerArt: contentItem.imageUrl,
    };

    try {
      await storePreset(speakerId, slotNumber, item);
      
      const button = event.target as HTMLButtonElement;
      button.textContent = '✓';
      setTimeout(() => {
        button.textContent = String(slotNumber);
      }, 1000);
      
      const popover = document.getElementById(popoverId) as HTMLElement;
      if (popover && 'hidePopover' in popover) {
        (popover as any).hidePopover();
      }
    } catch (e) {
      console.error("Failed to save preset", e);
      alert("Failed to save preset");
    }
  }
</script>

<button 
  id={triggerId}
  class="icon-btn"
  popovertarget={popoverId}
  title="Add to preset"
>
  <span class="material-symbols-rounded">bookmark_add</span>
</button>

<div id={popoverId} popover="auto" class="preset-popover">
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
  .icon-btn {
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: white;
    border-radius: 0.25rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    anchor-name: --preset-trigger;
  }

  .icon-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .preset-popover {
    padding: 0.75rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    
    /* CSS Anchor Positioning */
    position-anchor: --preset-trigger;
    position: absolute;
    position-try-fallbacks: --top, --bottom, --left, --right;
    inset: auto;
    margin: 0;
  }

  /* Default: below the button */
  .preset-popover {
    top: anchor(bottom);
    left: anchor(center);
    translate: -50% 0.5rem;
  }

  /* Fallback positions */
  @position-try --top {
    bottom: anchor(top);
    top: auto;
    translate: -50% -0.5rem;
  }

  @position-try --bottom {
    top: anchor(bottom);
    bottom: auto;
    translate: -50% 0.5rem;
  }

  @position-try --left {
    right: anchor(left);
    left: auto;
    translate: -0.5rem -50%;
  }

  @position-try --right {
    left: anchor(right);
    right: auto;
    translate: 0.5rem -50%;
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
