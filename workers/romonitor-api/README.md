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
tracking, and `/health`. Other API routes remain unchanged on the existing
backend until they are migrated and tested.
