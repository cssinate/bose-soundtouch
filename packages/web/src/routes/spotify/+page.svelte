<script lang="ts">
  import { onMount } from "svelte";
  import {
    getSpotifyStatus,
    getSpotifyPlaylists,
    getSpotifyPlaylistTracks,
    searchSpotify,
    playSpotifyUri,
    playSpotifyTrack,
    getSpeakers,
    storePreset,
  } from "$lib/api.js";
  import type { SpeakerInfo } from "$lib/types.js";

  let authenticated = $state(false);
  let loading = $state(true);
  let speakers: SpeakerInfo[] = $state([]);
  let selectedSpeaker: string | null = $state(null);
  let playlists: any[] = $state([]);
  let selectedPlaylist: any | null = $state(null);
  let tracks: any[] = $state([]);
  let searchQuery = $state("");
  let searchResults: any = $state(null);
  let view: "playlists" | "search" = $state("playlists");
  let showPresetDialog = $state(false);
  let pendingPreset: { type: "playlist" | "track"; item: any } | null = $state(null);
  let selectedPresetSlot: number | null = $state(null);

  onMount(async () => {
    try {
      const [status, spks] = await Promise.all([
        getSpotifyStatus(),
        getSpeakers(),
      ]);
      authenticated = status.authenticated;
      speakers = spks;
      if (speakers.length > 0) {
        selectedSpeaker = speakers[0].id;
      }

      if (authenticated) {
        await loadPlaylists();
      }
    } catch (e) {
      console.error("Failed to load Spotify status", e);
    } finally {
      loading = false;
    }
  });

  async function loadPlaylists() {
    try {
      const response = await getSpotifyPlaylists();
      playlists = response.items || [];
    } catch (e) {
      console.error("Failed to load playlists", e);
    }
  }

  async function loadPlaylistTracks(playlistId: string) {
    try {
      const response = await getSpotifyPlaylistTracks(playlistId);
      tracks = response.items || [];
    } catch (e) {
      console.error("Failed to load tracks", e);
    }
  }

  async function handlePlaylistClick(playlist: any) {
    selectedPlaylist = playlist;
    await loadPlaylistTracks(playlist.id);
  }

  function handleBackToPlaylists() {
    selectedPlaylist = null;
    tracks = [];
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    try {
      searchResults = await searchSpotify(searchQuery);
    } catch (e) {
      console.error("Search failed", e);
    }
  }

  async function handlePlayTrack(track: any) {
    if (!selectedSpeaker) return;
    try {
      await playSpotifyTrack(track.uri);
    } catch (e) {
      console.error("Failed to play track", e);
    }
  }

  async function handlePlayPlaylist(playlist: any) {
    if (!selectedSpeaker) return;
    try {
      await playSpotifyUri(playlist.uri);
    } catch (e) {
      console.error("Failed to play playlist", e);
    }
  }

  function openPresetDialog(type: "playlist" | "track", item: any) {
    pendingPreset = { type, item };
    showPresetDialog = true;
  }

  function closePresetDialog() {
    showPresetDialog = false;
    pendingPreset = null;
    selectedPresetSlot = null;
  }

  async function saveToPreset() {
    if (!selectedSpeaker || !selectedPresetSlot || !pendingPreset) return;

    const { type, item } = pendingPreset;
    const contentItem = {
      source: "SPOTIFY",
      type: type === "playlist" ? "playlist" : "track",
      location: item.uri,
      sourceAccount: "", // Will be filled by the speaker
      itemName: item.name,
      containerArt: item.images?.[0]?.url || "",
    };

    try {
      await storePreset(selectedSpeaker, selectedPresetSlot, contentItem);
      alert("Preset saved!");
      closePresetDialog();
    } catch (e) {
      console.error("Failed to save preset", e);
      alert("Failed to save preset");
    }
  }
</script>

{#if loading}
  <div class="loading">Loading Spotify...</div>
{:else if !authenticated}
  <div class="auth-prompt">
    <h1>Connect Spotify</h1>
    <p>Link your Spotify account to browse and play music on your SoundTouch speakers.</p>
    <a href="/auth/spotify" class="btn-primary">Connect Spotify</a>
  </div>
{:else}
  <div class="spotify-container">
    <div class="header">
      <h1>Spotify</h1>
      <div class="speaker-selector">
        <label for="speaker">Speaker:</label>
        <select id="speaker" bind:value={selectedSpeaker}>
          {#each speakers as speaker}
            <option value={speaker.id}>{speaker.name}</option>
          {/each}
        </select>
      </div>
      <div class="view-toggle">
        <button
          class:active={view === "playlists"}
          onclick={() => (view = "playlists")}
        >
          Playlists
        </button>
        <button
          class:active={view === "search"}
          onclick={() => (view = "search")}
        >
          Search
        </button>
      </div>
    </div>

    {#if view === "playlists"}
      {#if selectedPlaylist}
        <div class="tracks-view">
          <div class="playlist-header">
            <button class="back-btn" onclick={handleBackToPlaylists}>
              ← Back
            </button>
            <div class="playlist-info">
              {#if selectedPlaylist.images?.[0]?.url}
                <img src={selectedPlaylist.images[0].url} alt={selectedPlaylist.name} />
              {/if}
              <div>
                <h2>{selectedPlaylist.name}</h2>
                <p>{selectedPlaylist.tracks?.total || 0} tracks</p>
              </div>
            </div>
            <div class="playlist-actions">
              <button class="btn-primary" onclick={() => handlePlayPlaylist(selectedPlaylist)}>
                Play All
              </button>
              <button class="btn-secondary" onclick={() => openPresetDialog("playlist", selectedPlaylist)}>
                Save to Preset
              </button>
            </div>
          </div>
          <div class="track-list">
            {#each tracks as { track } (track.id)}
              <div class="track-item">
                {#if track.album?.images?.[0]?.url}
                  <img src={track.album.images[0].url} alt={track.name} class="track-art" />
                {/if}
                <div class="track-info">
                  <div class="track-name">{track.name}</div>
                  <div class="track-artist">{track.artists?.map((a: any) => a.name).join(", ")}</div>
                </div>
                <div class="track-actions">
                  <button onclick={() => handlePlayTrack(track)}>Play</button>
                  <button onclick={() => openPresetDialog("track", track)}>Preset</button>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {:else}
        <div class="playlist-grid">
          {#each playlists as playlist (playlist.id)}
            <div class="playlist-card" onclick={() => handlePlaylistClick(playlist)}>
              {#if playlist.images?.[0]?.url}
                <img src={playlist.images[0].url} alt={playlist.name} />
              {:else}
                <div class="placeholder-art">♫</div>
              {/if}
              <div class="playlist-name">{playlist.name}</div>
              <div class="playlist-tracks">{playlist.tracks?.total || 0} tracks</div>
            </div>
          {/each}
        </div>
      {/if}
    {:else}
      <div class="search-view">
        <div class="search-bar">
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search for songs, artists, albums..."
            onkeydown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button onclick={handleSearch}>Search</button>
        </div>
        {#if searchResults}
          <div class="search-results">
            {#if searchResults.tracks?.items?.length > 0}
              <section>
                <h3>Tracks</h3>
                <div class="track-list">
                  {#each searchResults.tracks.items as track (track.id)}
                    <div class="track-item">
                      {#if track.album?.images?.[0]?.url}
                        <img src={track.album.images[0].url} alt={track.name} class="track-art" />
                      {/if}
                      <div class="track-info">
                        <div class="track-name">{track.name}</div>
                        <div class="track-artist">{track.artists?.map((a: any) => a.name).join(", ")}</div>
                      </div>
                      <div class="track-actions">
                        <button onclick={() => handlePlayTrack(track)}>Play</button>
                        <button onclick={() => openPresetDialog("track", track)}>Preset</button>
                      </div>
                    </div>
                  {/each}
                </div>
              </section>
            {/if}
          </div>
        {/if}
      </div>
    {/if}
  </div>

  {#if showPresetDialog}
    <div class="dialog-overlay" onclick={closePresetDialog}>
      <div class="dialog" onclick={(e) => e.stopPropagation()}>
        <h2>Save to Preset</h2>
        <p>Select a preset button (1-6) to save this {pendingPreset?.type}:</p>
        <div class="preset-name"><strong>{pendingPreset?.item.name}</strong></div>
        <div class="preset-buttons">
          {#each [1, 2, 3, 4, 5, 6] as slot}
            <button
              class="preset-btn"
              class:selected={selectedPresetSlot === slot}
              onclick={() => (selectedPresetSlot = slot)}
            >
              {slot}
            </button>
          {/each}
        </div>
        <div class="dialog-actions">
          <button class="btn-secondary" onclick={closePresetDialog}>Cancel</button>
          <button
            class="btn-primary"
            disabled={!selectedPresetSlot}
            onclick={saveToPreset}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  {/if}
{/if}

<style>
  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    font-size: 1.2rem;
    color: var(--color-text-muted);
  }

  .auth-prompt {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    text-align: center;
    gap: 1rem;
    padding: 2rem;
  }

  .auth-prompt h1 {
    font-size: 2rem;
    margin: 0;
  }

  .auth-prompt p {
    color: var(--color-text-muted);
    max-width: 400px;
  }

  .btn-primary {
    padding: 0.75rem 1.5rem;
    background: var(--color-primary);
    color: white;
    border-radius: var(--radius-md);
    text-decoration: none;
    font-weight: 500;
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-secondary {
    padding: 0.75rem 1.5rem;
    background: var(--color-surface);
    color: var(--color-text);
    border-radius: var(--radius-md);
    font-weight: 500;
  }

  .btn-secondary:hover {
    background: var(--color-surface-hover);
  }

  .spotify-container {
    padding: 1.5rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .header h1 {
    margin: 0;
    font-size: 1.8rem;
  }

  .speaker-selector {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .speaker-selector select {
    padding: 0.5rem 1rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text);
  }

  .view-toggle {
    display: flex;
    gap: 0.5rem;
  }

  .view-toggle button {
    padding: 0.5rem 1rem;
    background: var(--color-surface);
    border-radius: var(--radius-sm);
  }

  .view-toggle button.active {
    background: var(--color-primary);
    color: white;
  }

  .playlist-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 1.5rem;
  }

  .playlist-card {
    background: var(--color-surface);
    border-radius: var(--radius-md);
    padding: 1rem;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .playlist-card:hover {
    transform: translateY(-4px);
  }

  .playlist-card img,
  .placeholder-art {
    width: 100%;
    aspect-ratio: 1;
    border-radius: var(--radius-sm);
    object-fit: cover;
    margin-bottom: 0.75rem;
  }

  .placeholder-art {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-background);
    font-size: 3rem;
    color: var(--color-text-muted);
  }

  .playlist-name {
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  .playlist-tracks {
    font-size: 0.9rem;
    color: var(--color-text-muted);
  }

  .tracks-view {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .playlist-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .back-btn {
    padding: 0.5rem 1rem;
    background: var(--color-surface);
    border-radius: var(--radius-sm);
  }

  .playlist-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
  }

  .playlist-info img {
    width: 80px;
    height: 80px;
    border-radius: var(--radius-sm);
  }

  .playlist-info h2 {
    margin: 0;
    font-size: 1.4rem;
  }

  .playlist-info p {
    margin: 0.25rem 0 0;
    color: var(--color-text-muted);
  }

  .playlist-actions {
    display: flex;
    gap: 0.5rem;
  }

  .track-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .track-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    background: var(--color-surface);
    border-radius: var(--radius-sm);
  }

  .track-art {
    width: 50px;
    height: 50px;
    border-radius: var(--radius-xs);
    object-fit: cover;
  }

  .track-info {
    flex: 1;
  }

  .track-name {
    font-weight: 500;
  }

  .track-artist {
    font-size: 0.9rem;
    color: var(--color-text-muted);
    margin-top: 0.25rem;
  }

  .track-actions {
    display: flex;
    gap: 0.5rem;
  }

  .track-actions button {
    padding: 0.5rem 1rem;
    background: var(--color-surface-hover);
    border-radius: var(--radius-sm);
    font-size: 0.9rem;
  }

  .search-view {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .search-bar {
    display: flex;
    gap: 0.5rem;
  }

  .search-bar input {
    flex: 1;
    padding: 0.75rem 1rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text);
    font-size: 1rem;
  }

  .search-bar button {
    padding: 0.75rem 1.5rem;
    background: var(--color-primary);
    color: white;
    border-radius: var(--radius-sm);
    font-weight: 500;
  }

  .search-results section {
    margin-bottom: 2rem;
  }

  .search-results h3 {
    margin: 0 0 1rem;
    font-size: 1.3rem;
  }

  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .dialog {
    background: var(--color-background);
    border-radius: var(--radius-md);
    padding: 2rem;
    max-width: 500px;
    width: 90%;
  }

  .dialog h2 {
    margin: 0 0 1rem;
  }

  .dialog p {
    color: var(--color-text-muted);
    margin-bottom: 1rem;
  }

  .preset-name {
    margin-bottom: 1.5rem;
    padding: 0.75rem;
    background: var(--color-surface);
    border-radius: var(--radius-sm);
  }

  .preset-buttons {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .preset-btn {
    aspect-ratio: 1;
    padding: 0;
    background: var(--color-surface);
    border: 2px solid transparent;
    border-radius: var(--radius-sm);
    font-size: 1.2rem;
    font-weight: 600;
  }

  .preset-btn.selected {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
  }

  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
</style>
