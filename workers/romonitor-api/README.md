# RoMonitor API Worker

This Worker is deployed manually to Cloudflare and is not connected to GitHub.

## Local checks

From the repository root:

```powershell
npm test --prefix workers\romonitor-api
npx wrangler deploy --config workers\romonitor-api\wrangler.toml --dry-run --outdir workers\romonitor-api\dist
```

## Manual deployment

```powershell
npx wrangler deploy --config workers\romonitor-api\wrangler.toml
```

The current Worker serves the Romania news digest, Romania-bounds aircraft
tracking, and `/health`. News, economic, market, military, and webcam routes
not implemented directly in the Worker are forwarded to the existing backend,
which preserves its API-key authentication while migration continues.
