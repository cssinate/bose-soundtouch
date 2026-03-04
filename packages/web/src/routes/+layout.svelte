<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { getServiceStatus } from "$lib/api.js";

  let { children } = $props();
  let services = $state<Array<{ id: string; name: string }>>([]);

  onMount(async () => {
    try {
      const status = await getServiceStatus();
      // Convert services object to array for iteration
      if (status.services) {
        services = Object.keys(status.services).map((id) => ({
          id,
          name: id.charAt(0).toUpperCase() + id.slice(1),
        }));
      }
    } catch (e) {
      console.error("Failed to get service status", e);
    }
  });
</script>

<div class="app">
  <header>
    <h1>SoundTouch</h1>
    <nav>
      <a href="/" class:active={page.url.pathname === "/"}>Speakers</a>
      {#each services as service}
        <a
          href="/services/{service.id}"
          class:active={page.url.pathname === `/services/${service.id}`}
        >
          {service.name}
        </a>
      {/each}
    </nav>
  </header>
  <main>
    {@render children()}
  </main>
</div>

<style>
  .app {
    max-width: 1200px;
    margin: 0 auto;
    min-height: 100vh;
  }

  header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--color-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  h1 {
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  nav {
    display: flex;
    gap: 1rem;
  }

  nav a {
    padding: 0.5rem 1rem;
    text-decoration: none;
    color: var(--color-text-muted);
    border-radius: var(--radius-sm);
    transition: color 0.2s, background 0.2s;
  }

  nav a:hover {
    color: var(--color-text);
    background: var(--color-surface);
  }

  nav a.active {
    color: var(--color-text);
    background: var(--color-surface);
    font-weight: 500;
  }

  main {
    padding-bottom: 2rem;
  }
</style>
