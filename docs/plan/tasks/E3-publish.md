# E3 — Publish: GitHub + registry hosting (do with the owner)

**Goal:** others can `npx shadcn init https://<host>/r/fiori.json`.

Needs the owner's decisions and accounts; an agent should prepare everything and stop before anything public.

## Decisions for the owner (ask, don't assume)

1. Repository name and visibility (public/private). Avoid "SAP"/"Fiori" as a product name (trademarks); README already
   says "built on the SAP Horizon design language, not an SAP product".
2. Host for the registry + docs: GitHub Pages, Vercel, Netlify or a company server.
3. Final registry URL (it is baked into `fiori.json` as the `@fiori` namespace: `REGISTRY_URL=… pnpm registry:build`).

## Prepare (agent)

- `vite.config.ts`: configurable `base` (`BASE_PATH` env) for GitHub Pages sub-paths; make sure `dist/` contains `r/`
  (it does via `publicDir`) and `block.html`/`ui5.html` work under the base path.
- CI workflow `.github/workflows/ci.yml`: install, `pnpm exec playwright install --with-deps chromium`, `pnpm check`;
  upload `test-results/visual` on failure.
- Deploy workflow (only for the chosen host), building with `REGISTRY_URL` set.
- `package.json` `repository`/`homepage` fields; README install URL.
- Smoke test script `scripts/smoke-install.mjs`: creates a temp Vite app, runs `shadcn init <url>/r/fiori.json` and
  `shadcn add @fiori/list-report`, builds it. Run it against a local `vite preview` before publishing.

## Owner steps (not the agent)

Create the GitHub repo, add the remote, push, enable Pages/Vercel, then run the smoke test against the public URL.

## Acceptance

CI green on the first push; smoke test passes against the public URL.
