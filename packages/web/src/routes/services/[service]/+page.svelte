<script lang="ts">
  import { page } from "$app/stores";
  import MusicService from "$lib/components/MusicService.svelte";
  import type { MusicServicePlugin } from "@soundtouch/core";

  // Dynamic plugin loading based on route
  // In a full implementation, this would dynamically import based on available plugins
  let service: MusicServicePlugin | null = $state(null);
  let error: string | null = $state(null);

  $effect(() => {
    const serviceId = $page.params.service;
    
    // Dynamically load the service plugin
    loadService(serviceId);
  });

  async function loadService(serviceId: string) {
    try {
      const module = await import(`@soundtouch/${serviceId}`);
      service = module[serviceId] as MusicServicePlugin;
    } catch (err) {
      console.error(`Failed to load service: ${serviceId}`, err);
      error = `Service "${serviceId}" not found or not installed`;
    }
  }
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
