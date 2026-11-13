# E3 — Publish: GitHub repository, CI, and the registry on GitHub Pages

**Goal:** the project lives at `https://github.com/snest007/fiori-shadcn-remaster`, CI proves every push, and anyone can
install it with

```bash
npx shadcn@latest init https://snest007.github.io/fiori-shadcn-remaster/r/fiori.json
```

The docs site is served from the same Pages deployment: `https://snest007.github.io/fiori-shadcn-remaster/`.

Decisions already made by the owner (don't revisit): GitHub account `snest007`, repository `fiori-shadcn-remaster`,
hosting on **GitHub Pages** (project site, sub-path `/fiori-shadcn-remaster/`). Codex has the owner's GitHub
credentials configured. This card is run by a single Codex session **in the main checkout on `main`** (it is about the
repository itself, not a component) — don't use `RUN.md`'s worktree/sub-agent flow. Push only what this card says.

## 0. Preflight — stop and report if any of these fail

```bash
git switch main && git status --short            # must be empty
git log --oneline -1                             # note the hash
node scripts/integrate.mjs status                # no pending codex/* branches, no worktrees
gh auth status || git ls-remote https://github.com/snest007/fiori-shadcn-remaster.git   # credentials work
```

The repository URL returned 404 anonymously on 2026-11-13: it either doesn't exist yet or is private.
- If it doesn't exist: create it **public**, empty (no README / license / .gitignore), description
  "SAP Horizon (Fiori) look and interaction for React, as a shadcn/ui registry. Not an SAP product."
  (`gh repo create snest007/fiori-shadcn-remaster --public --description "…"`, or the GitHub API with the configured token).
- If it exists and is **private**: GitHub Pages on a free plan needs a public repository. Stop and ask the owner
  before changing visibility.
- If it exists and is **not empty**: stop and report its branches/commits; never force-push over someone's history.

## 1. Make the site and registry work under a sub-path

Pages serves the project at `/fiori-shadcn-remaster/`, not `/`.

- `vite.config.ts`: `base: process.env.BASE_PATH ?? "/"`. Check every runtime URL builder in the docs app respects
  `import.meta.env.BASE_URL`: links between `index.html`, `ui5.html`, `block.html`, `?fixtures`, `#/<component>` routes,
  the 72-font / icon / illustration asset URLs, and anything in `docs/src/**` that hard-codes a leading `/`
  (`grep -rn "\"/\|'/\|\`/" docs/src`). Fix them to be base-relative. Playwright keeps running at base `/` —
  don't change the tests except where a URL builder moved.
- `scripts/build-registry-json.mjs`: `homepage` → `https://github.com/snest007/fiori-shadcn-remaster`
  (currently a placeholder repo). `REGISTRY_URL` stays an env var (default `http://localhost:4173/r` for local work).
- `package.json`: add `"repository": { "type": "git", "url": "https://github.com/snest007/fiori-shadcn-remaster.git" }`,
  `"homepage": "https://snest007.github.io/fiori-shadcn-remaster/"`. Keep `"private": true` (we publish a shadcn registry,
  not an npm package).
- New script `"build:pages"`: `REGISTRY_URL=https://snest007.github.io/fiori-shadcn-remaster/r BASE_PATH=/fiori-shadcn-remaster/ pnpm registry:build && BASE_PATH=/fiori-shadcn-remaster/ pnpm build`
  — `dist/` then holds the site, `dist/r/*.json`, `block.html`, `ui5.html`. Add an empty `dist/.nojekyll` (Pages
  must not drop underscore files). Verify locally: `pnpm build:pages && npx vite preview --base /fiori-shadcn-remaster/ --outDir dist --port 4380`
  (or any static server mounted at that sub-path), open the docs, a component route, `block.html?name=list-report`,
  `ui5.html` and `r/fiori.json`; no 404s in the network log.

## 2. CI and Pages workflows

`.github/workflows/ci.yml` — on push to `main` and on pull requests:
- `actions/checkout@v4`, `pnpm/action-setup@v4` (version from `packageManager`), `actions/setup-node@v4` (Node 24, pnpm cache).
- `pnpm install --frozen-lockfile`, `pnpm exec playwright install --with-deps chromium`.
- Cache `~/.ui5` keyed on `sapui5/ui5.yaml` (the OpenUI5 reference framework, ~230 MB; first run downloads it).
- `pnpm generate && pnpm typecheck && pnpm registry:build && pnpm build`, then `pnpm exec playwright test --retries=0`
  with `PORT=4310 SAPUI5_PORT=4311`.
- On failure, upload `test-results/` (visual diff PNGs) as an artifact. Timeout 60 min.
- The suite takes ~7 min with 7 workers locally; GitHub runners have fewer cores — leave `workers: "75%"` as configured
  and don't add retries. If a test only fails on CI, that's a real finding: report it, don't paper over it.

`.github/workflows/pages.yml` — on push to `main` and `workflow_dispatch`, permissions `pages: write`, `id-token: write`,
concurrency group `pages`:
- same install + `pnpm generate`, then `pnpm build:pages`;
- `actions/configure-pages@v5`, `actions/upload-pages-artifact@v3` with `path: dist`, `actions/deploy-pages@v4`.
- Then a smoke job: `node scripts/smoke-install.mjs --registry=https://snest007.github.io/fiori-shadcn-remaster/r`
  (it already supports `--registry`; retry its first fetch for up to 2 minutes while Pages propagates — add that wait to
  the script's `waitFor` for remote registries only).

Enable Pages with source "GitHub Actions" (`gh api -X POST repos/snest007/fiori-shadcn-remaster/pages -f build_type=workflow`,
or `PUT` if it already exists).

## 3. Docs and repo hygiene

- README: replace `https://<your-host>/r/fiori.json` with the real URL; add the docs link and CI badge
  (`![CI](https://github.com/snest007/fiori-shadcn-remaster/actions/workflows/ci.yml/badge.svg)`); keep the "not an SAP
  product / trademarks" note at the top. Add a short "Contributing" pointer to CONTRIBUTING.md and AGENTS.md.
- `LICENSE` file: Apache-2.0 full text, copyright "2026 snest007"; keep README's SAP third-party notice
  (theme values, fonts, icons, illustrations © SAP SE under Apache-2.0). Add `NOTICE` listing those SAP packages.
- Make sure nothing private or local ends up in git: `git ls-files | grep -E '\.integration|\.worktrees|\.env|test-results|/\.claude/'`
  must be empty except `.claude/launch.json` (fine to keep). No absolute `/Users/...` paths in tracked files
  (`git grep -n '/Users/' -- ':!pnpm-lock.yaml'` → fix or remove any hit, e.g. in docs/plan evidence references).
- Run the full local acceptance once more on the final commit: `node scripts/integrate.mjs verify` (3 runs + smoke).

## 4. Push and deploy

```bash
git remote add origin https://github.com/snest007/fiori-shadcn-remaster.git   # or set-url if it exists
git push -u origin main
```

Push `main` only (no other branches, no tags). Then watch both workflows (`gh run watch`, or poll the API every 30 s,
max 60 min). Both must be green. Open the deployed URLs and run, from a clean temp dir:

```bash
node scripts/smoke-install.mjs --registry=https://snest007.github.io/fiori-shadcn-remaster/r
```

## Acceptance

- Repository public at `snest007/fiori-shadcn-remaster`, `main` pushed, history intact (same commits as local `main`).
- CI workflow green on the pushed commit; Pages workflow green; Pages smoke job green.
- `https://snest007.github.io/fiori-shadcn-remaster/r/fiori.json` returns 200; the docs site, a component route,
  `block.html?name=launchpad` and `ui5.html` load without 404s or console errors.
- Local smoke against the public registry: `✔ smoke install OK: 81 components, 7 blocks …`.
- Tick E3 in `docs/plan/README.md`, commit, push (CI runs again — must stay green).

Final message: the public URLs, the CI and Pages run links with their conclusions, the smoke output line, and anything
that needs the owner (e.g. a CI-only failure, a visibility question). Keep it short.
