# Web Package Architecture

## Plugin Dependencies

While the web UI is **generic and plugin-agnostic** (no hardcoded routes or service names), plugin packages still need to be listed as dependencies for the bundler to include them.

### Why?

- Browser bundlers (Vite) need to know about packages at **build time**
- Dynamic imports like `import('@soundtouch/spotify')` only work if the package is in the bundle
- Can't load arbitrary npm packages at runtime in the browser

### How It Works

1. **Server-side**: Plugins are discovered dynamically from config (no dependencies needed)
2. **Client-side**: Plugins must be in `package.json` dependencies to be bundled

### Adding a New Service to the UI

To add support for a new music service (e.g., Deezer):

1. Create the plugin package: `@soundtouch/deezer`
2. Add to `packages/web/package.json`:
   ```json
   {
     "dependencies": {
       "@soundtouch/spotify": "workspace:*",
       "@soundtouch/deezer": "workspace:*"
     }
   }
   ```
3. Add config to `soundtouch.config.yaml`:
   ```yaml
   deezer:
     appId: "your-app-id"
     appSecret: "your-app-secret"
   ```
4. Rebuild: `pnpm build`

The UI will automatically:
- Detect the service is enabled
- Create navigation link
- Load the plugin when accessed
- Render it with the generic component

## Benefits vs. Trade-offs

✅ **Benefits**:
- Generic UI (no hardcoded service names)
- Dynamic routes (one route handles all services)
- Consistent UX across all services
- Type-safe plugin loading

⚠️ **Trade-off**:
- Must add plugins to `package.json` (not truly "zero config")
- Bundle includes all plugins (but they're lazy-loaded)

## Alternative Approaches

If you want truly zero client-side dependencies on plugins:

1. **Server-side rendering only**: UI never imports plugins directly, only calls API endpoints
2. **Micro-frontends**: Each plugin provides its own UI bundle loaded at runtime
3. **iframe approach**: Embed service UIs as separate apps

For most use cases, the current approach (dependencies + dynamic loading) provides the best balance of DX and bundle size.
