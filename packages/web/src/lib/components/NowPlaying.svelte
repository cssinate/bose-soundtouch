<script lang="ts">
  import type { NowPlaying } from "$lib/types.js";

  let { nowPlaying }: { nowPlaying: NowPlaying | null } = $props();
</script>

<div class="now-playing">
  {#if nowPlaying?.art}
    <img class="album-art" src={nowPlaying.art} alt="Album art" />
  {:else}
    <div class="album-art placeholder">
      <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
        <path
          d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"
        />
      </svg>
    </div>
  {/if}

  <div class="info">
    {#if nowPlaying?.track}
      <p class="track">{nowPlaying.track}</p>
    {:else if nowPlaying?.stationName}
      <p class="track">{nowPlaying.stationName}</p>
    {:else}
      <p class="track empty">Nothing playing</p>
    {/if}

    {#if nowPlaying?.artist}
      <p class="artist">{nowPlaying.artist}</p>
    {/if}

    {#if nowPlaying?.album}
      <p class="album">{nowPlaying.album}</p>
    {/if}
  </div>
</div>

<style>
  .now-playing {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
  }

  .album-art {
    width: 200px;
    height: 200px;
    border-radius: var(--radius);
    object-fit: cover;
    box-shadow: var(--shadow);
  }

  .album-art.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-surface);
    color: var(--color-text-secondary);
  }

  .info {
    text-align: center;
    min-height: 4rem;
  }

  .track {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  .track.empty {
    color: var(--color-text-secondary);
  }

  .artist {
    color: var(--color-text-secondary);
    font-size: 0.95rem;
  }

  .album {
    color: var(--color-text-secondary);
    font-size: 0.85rem;
    opacity: 0.7;
    margin-top: 0.15rem;
  }
</style>
