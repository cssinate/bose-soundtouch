<script lang="ts">
  import { page } from "$app/state";
  import MusicService from "$lib/components/MusicService.svelte";
  import type { MusicServicePlugin } from "@soundtouch/core";

  import { spotify } from "@soundtouch/spotify";

  const AVAILABLE_SERVICES: Record<string, MusicServicePlugin> = {
    spotify,
  };

  const serviceId = $derived(page.params.service);
  const service = $derived(AVAILABLE_SERVICES[serviceId ?? ''] || null);
  const error = $derived(!service ? `Service "${serviceId}" not found` : null);
</script>

{#if error}
  <div class="error">
    <h2>⚠️ {error}</h2>
    <p>Make sure the service plugin is installed and enabled in your configuration.</p>
    <a href="/">Back to Speakers</a>
  </div>
{:else if service}
  <MusicService {service} />
{:else}
  <div class="loading">Loading...</div>
{/if}

<style>
  .error,
  .loading {
    padding: 4rem 2rem;
    text-align: center;
  }

  .error h2 {
    margin-bottom: 1rem;
  }

  .error a {
    color: #1db954;
    text-decoration: none;
    font-weight: 600;
  }
</style>
