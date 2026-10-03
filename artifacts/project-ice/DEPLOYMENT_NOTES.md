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

## Current workflow

Project Ice no longer uses Replit for coding, hosting, deployment, or testing. The active workflow is:

- Source control and code review: GitHub (`danner821/The-Project-Ice`)
- Production and branch previews: Cloudflare Workers Builds
- Production branch: `main`
- Non-production branches: isolated Cloudflare Worker Previews
- Local/CI validation: GitHub Actions and disposable browser/IndexedDB tests

Any remaining `@replit/*` package names in dormant scaffold/build dependencies are legacy package dependencies only; they do **not** mean Replit is part of the active Project Ice workflow. Do not introduce Replit-specific deployment or development steps going forward.
