<script>
  import "../app.css";

  let { children } = $props();
</script>

<div class="app">
  <header>
    <h1>SoundTouch</h1>
  </header>
  <main>
    {@render children()}
  </main>
</div>

<style>
  .app {
    max-width: 480px;
    margin: 0 auto;
    min-height: 100vh;
  }

  header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--color-border);
  }

  h1 {
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  main {
    padding-bottom: 2rem;
  }
</style>
