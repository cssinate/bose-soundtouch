<script lang="ts">
  import { onMount } from "svelte";
  import PresetPopover from "$lib/components/PresetPopover.svelte";
  import { selectedSpeaker } from "$lib/stores.js";
  import type { MusicServicePlugin } from "@soundtouch/core";

  interface Props {
    service: MusicServicePlugin;
  }

  let { service }: Props = $props();

  let authenticated = $state(false);
  let loading = $state(true);
  let authError: string | null = $state(null);
  let speakerId: string | null = $state(null);
  let playlists: any[] = $state([]);
  let selectedPlaylist: any | null = $state(null);
  let tracks: any[] = $state([]);
  let searchQuery = $state("");
  let searchResults: any = $state(null);
  let view: "playlists" | "search" = $state("playlists");
  let currentlyPlayingUri: string | null = $state(null);
  let shuffleEnabled = $state(false);

  // Subscribe to selected speaker from global store
  $effect(() => {
    const unsubscribe = selectedSpeaker.subscribe(value => {
      speakerId = value;
    });
    return unsubscribe;
  });

  onMount(async () => {
    try {
      const status = await service.api.getStatus();
      authenticated = status.authenticated;
      authError = null;

      if (authenticated) {
        await loadPlaylists();
      }
    } catch (err) {
      console.error(`Failed to load ${service.metadata.name}:`, err);
      authError = err instanceof Error ? err.message : "Failed to connect";
    } finally {
      loading = false;
    }
  });

  async function loadPlaylists() {
    try {
      playlists = await service.api.getPlaylists();
      authError = null;
    } catch (err) {
      console.error("Failed to load playlists:", err);
      if (err instanceof Error && err.message.includes("401")) {
        authError = "Session expired. Please reconnect.";
        authenticated = false;
      }
    }
  }

  async function loadPlaylistTracks(playlistId: string) {
    try {
      tracks = await service.api.getPlaylistTracks(playlistId);
      authError = null;
    } catch (err) {
      console.error("Failed to load tracks:", err);
      if (err instanceof Error && err.message.includes("401")) {
        authError = "Session expired. Please reconnect.";
        authenticated = false;
      }
    }
  }

  async function handlePlaylistClick(playlist: any) {
    selectedPlaylist = playlist;
    await loadPlaylistTracks(playlist.id);
    history.pushState({ view: "playlist", playlistId: playlist.id }, "");
  }

  function handleBack() {
    selectedPlaylist = null;
    tracks = [];
    history.back();
  }

  async function handlePlayPlaylist(playlist: any) {
    if (!speakerId) {
      console.error("No speaker selected");
      return;
    }
    try {
      await service.api.playUri(speakerId, playlist.uri, {
        name: playlist.name,
        imageUrl: playlist.imageUrl,
      });
      currentlyPlayingUri = playlist.uri;
      authError = null;
    } catch (err) {
      console.error("Failed to play:", err);
      if (err instanceof Error && err.message.includes("401")) {
        authError = "Session expired. Please reconnect.";
        authenticated = false;
      } else {
        alert(`Failed to play: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  }

  async function handlePlayTrack(track: any) {
    if (!speakerId) {
      console.error("No speaker selected");
      return;
    }
    try {
      await service.api.playTrack(speakerId, track.uri, {
        name: track.name,
        imageUrl: track.imageUrl,
      });
      currentlyPlayingUri = track.uri;
      authError = null;
    } catch (err) {
      console.error("Failed to play track:", err);
      if (err instanceof Error && err.message.includes("401")) {
        authError = "Session expired. Please reconnect.";
        authenticated = false;
      } else {
        alert(`Failed to play: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    try {
      searchResults = await service.api.search(searchQuery);
    } catch (err) {
      console.error("Failed to search:", err);
    }
  }

  window.addEventListener("popstate", (e) => {
    if (e.state?.view === "playlist") {
      const playlist = playlists.find((p) => p.id === e.state.playlistId);
      if (playlist) {
        selectedPlaylist = playlist;
        loadPlaylistTracks(playlist.id);
      }
    } else {
      selectedPlaylist = null;
      tracks = [];
    }
  });
</script>

<div class="music-service">
  {#if loading}
    <div class="loading">Loading {service.metadata.name}...</div>
  {:else if authError || !authenticated}
    <div class="auth-prompt">
      <h2>Connect to {service.metadata.name}</h2>
      {#if authError}
        <p class="error-message">{authError}</p>
      {/if}
      <p>Connect your {service.metadata.name} account to browse and play music on your SoundTouch speakers.</p>
      <a href={service.metadata.authUrl} class="connect-btn">
        {authError ? 'Reconnect' : 'Connect'} {service.metadata.name}
      </a>
    </div>
  {:else if selectedPlaylist}
    <div class="playlist-details">
      <button class="back-btn" onclick={handleBack}>
        <span class="material-symbols-rounded">arrow_back</span>
        Back to Playlists
      </button>

      <div class="playlist-header">
        {#if selectedPlaylist.imageUrl}
          <img
            src={selectedPlaylist.imageUrl}
            alt={selectedPlaylist.name}
            class="playlist-art"
            style="view-transition-name: playlist-art-{selectedPlaylist.id}"
          />
        {/if}
        <div class="playlist-info">
          <h2 style="view-transition-name: playlist-title-{selectedPlaylist.id}">
            {selectedPlaylist.name}
          </h2>
          {#if selectedPlaylist.description}
            <p class="description">{selectedPlaylist.description}</p>
          {/if}
          <p class="track-count">{selectedPlaylist.trackCount} tracks</p>
        </div>
      </div>

      <div class="tracks-list">
        {#each tracks as track, i}
          <div class="track-item">
            <span class="track-number">{i + 1}</span>
            {#if track.imageUrl}
              <img src={track.imageUrl} alt={track.name} class="track-thumb" />
            {/if}
            <div class="track-info">
              <div class="track-name">{track.name}</div>
              <div class="track-artist">{track.artist}</div>
            </div>
            <button
              class="icon-btn"
              onclick={() => handlePlayTrack(track)}
              title="Play track"
            >
              <span class="material-symbols-rounded">play_arrow</span>
            </button>
            <PresetPopover contentItem={track} speakerId={speakerId} triggerId="track-{track.id}" />
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <div class="controls">
      <div class="view-toggle">
        <button
          class="tab-btn"
          class:active={view === "playlists"}
          onclick={() => (view = "playlists")}
        >
          Playlists
        </button>
        <button
          class="tab-btn"
          class:active={view === "search"}
          onclick={() => (view = "search")}
        >
          Search
        </button>
      </div>

      {#if view === "search"}
        <div class="search-box">
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search for songs, albums, artists..."
            onkeydown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button onclick={handleSearch}>Search</button>
        </div>
      {/if}
    </div>

    {#if view === "playlists"}
      <div class="playlists-grid">
        {#each playlists as playlist}
          <div class="playlist-card">
            {#if playlist.imageUrl}
              <button
                class="playlist-art-btn"
                onclick={() => handlePlaylistClick(playlist)}
                aria-label="View {playlist.name}"
              >
                <img
                  src={playlist.imageUrl}
                  alt={playlist.name}
                  style="view-transition-name: playlist-art-{playlist.id}"
                />
              </button>
            {/if}
            <h3 style="view-transition-name: playlist-title-{playlist.id}">
              {playlist.name}
              {#if playlist.trackCount}
                <span class="track-count">({playlist.trackCount})</span>
              {/if}
            </h3>
            <div class="playlist-actions">
              <button
                class="icon-btn"
                onclick={() => handlePlaylistClick(playlist)}
                title="View details"
              >
                <span class="material-symbols-rounded">queue_music</span>
              </button>
              <PresetPopover contentItem={playlist} speakerId={speakerId} triggerId="playlist-{playlist.id}" />
              <button
                class="icon-btn"
                onclick={() => handlePlayPlaylist(playlist)}
                title="Play now"
              >
                <span class="material-symbols-rounded">play_arrow</span>
              </button>
              {#if currentlyPlayingUri === playlist.uri}
                <button class="icon-btn" title="Toggle shuffle">
                  <span class="material-symbols-rounded">shuffle</span>
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {:else if searchResults}
      <div class="search-results">
        <h3>Search Results</h3>
        <!-- Search results rendering would go here -->
      </div>
    {/if}
  {/if}
</div>

<style>
  .music-service {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .loading,
  .auth-prompt {
    text-align: center;
    padding: 4rem 2rem;
  }

  .auth-prompt h2 {
    font-size: 2rem;
    margin-bottom: 1rem;
  }

  .connect-btn {
    display: inline-block;
    padding: 1rem 2rem;
    background: #1db954;
    color: white;
    text-decoration: none;
    border-radius: 2rem;
    font-weight: 600;
    margin-top: 2rem;
  }

  .error-message {
    color: #ff4444;
    font-weight: 600;
    margin-bottom: 1rem;
  }

  .controls {
    margin-bottom: 2rem;
  }

  .view-toggle {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .tab-btn {
    padding: 0.75rem 1.5rem;
    background: none;
    border: 1px solid #333;
    color: white;
    cursor: pointer;
    border-radius: 0.5rem;
  }

  .tab-btn.active {
    background: #1db954;
    border-color: #1db954;
  }

  .search-box {
    display: flex;
    gap: 0.5rem;
  }

  .search-box input {
    flex: 1;
    padding: 0.75rem;
    background: #282828;
    border: 1px solid #333;
    color: white;
    border-radius: 0.5rem;
  }

  .search-box button {
    padding: 0.75rem 1.5rem;
    background: #1db954;
    border: none;
    color: white;
    border-radius: 0.5rem;
    cursor: pointer;
  }

  .playlists-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1.5rem;
  }

  .playlist-card {
    background: #181818;
    padding: 1rem;
    border-radius: 0.5rem;
    transition: background 0.2s;
  }

  .playlist-card:hover {
    background: #282828;
  }

  .playlist-art-btn {
    width: 100%;
    padding: 0;
    background: none;
    border: none;
    cursor: pointer;
    margin-bottom: 1rem;
  }

  .playlist-art-btn img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: 0.25rem;
  }

  .playlist-card h3 {
    font-size: 1rem;
    margin-bottom: 0.5rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .track-count {
    opacity: 0.6;
    font-size: 0.9em;
  }

  .playlist-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

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
  }

  .icon-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: none;
    border: 1px solid #333;
    color: white;
    border-radius: 0.5rem;
    cursor: pointer;
    margin-bottom: 2rem;
  }

  .playlist-header {
    display: flex;
    gap: 2rem;
    margin-bottom: 2rem;
  }

  .playlist-art {
    width: 200px;
    height: 200px;
    object-fit: cover;
    border-radius: 0.5rem;
  }

  .playlist-info h2 {
    font-size: 2rem;
    margin-bottom: 1rem;
  }

  .description {
    opacity: 0.7;
    margin-bottom: 0.5rem;
  }

  .tracks-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .track-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    background: #181818;
    border-radius: 0.5rem;
  }

  .track-item:hover {
    background: #282828;
  }

  .track-number {
    opacity: 0.6;
    min-width: 2rem;
    text-align: center;
  }

  .track-thumb {
    width: 40px;
    height: 40px;
    object-fit: cover;
    border-radius: 0.25rem;
  }

  .track-info {
    flex: 1;
    min-width: 0;
  }

  .track-name {
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .track-artist {
    font-size: 0.9rem;
    opacity: 0.7;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
