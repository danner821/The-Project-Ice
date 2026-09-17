# Project Ice Production Deployment Notes

This file documents the first production-hosting setup for Project Ice.

- Production host: Cloudflare Workers static assets
- Cloudflare project name: `the-project-ice`
- Cloudflare build root/path: `artifacts/project-ice`
- Build command: `pnpm run build`
- Deploy command: `npx wrangler deploy`
- Build output: `dist/public`
- Canonical gameplay runtime remains unchanged.
- No service worker/offline cache is enabled during the four-year HS QA playthrough.
- IndexedDB remains the canonical career-save persistence layer and is origin-specific.

The initial production URL should remain stable once the canonical fresh-career QA save is created.
