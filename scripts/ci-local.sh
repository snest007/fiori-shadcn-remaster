#!/usr/bin/env bash
set -euo pipefail
if ! command -v docker >/dev/null 2>&1 || ! docker info >/dev/null 2>&1; then
  echo 'Docker is unavailable; start Docker to reproduce Linux CI locally.' >&2
  exit 1
fi
repo_root="$(cd "$(dirname "$0")/.." && pwd)"
result_dir="$(mktemp -d "${TMPDIR:-/tmp}/petalo-ci-local.XXXXXX")"
echo "Linux CI logs: $result_dir"
# Read-only source + a container-local install preserve the host's macOS dependencies.
docker run --rm --init --ipc=host \
  -v "$repo_root:/source:ro" -v "$result_dir:/results" -w /work \
  -e CI=1 -e PORT="${PORT:-4310}" -e SAPUI5_PORT="${SAPUI5_PORT:-4311}" \
  mcr.microsoft.com/playwright:v1.64.1-noble bash -c '
    set -euo pipefail
    tar -C /source --exclude=node_modules --exclude=.git --exclude=.worktrees --exclude=.claude --exclude=test-results --exclude=dist --exclude=storybook-static --exclude=registry.json --exclude=public/r -cf - . | tar -C /work -xf -
    # The Playwright image includes browsers, not the repository-required Node 24.
    curl -fsSL https://nodejs.org/dist/latest-v24.x/SHASUMS256.txt -o /tmp/node-shasums
    arch="$(uname -m)"; case "$arch" in x86_64) arch=x64;; aarch64) arch=arm64;; esac
    archive="$(awk -v arch="$arch" '\''$2 ~ "linux-" arch "\\.tar\\.gz$" {print $2}'\'' /tmp/node-shasums)"
    curl -fsSL "https://nodejs.org/dist/latest-v24.x/$archive" -o "/tmp/$archive"
    (cd /tmp; grep " $archive\$" node-shasums | sha256sum -c -)
    tar -C /usr/local --strip-components=1 -xf "/tmp/$archive"
    npm install --global pnpm@10.26.2 > /results/setup.log 2>&1
    pnpm install --frozen-lockfile >> /results/setup.log 2>&1
    pnpm generate >> /results/setup.log 2>&1
    pnpm registry:build >> /results/setup.log 2>&1
    pnpm build >> /results/setup.log 2>&1
    set +e
    pnpm test:summary "$@" --retries=0
    status=$?
    cp -a test-results/. /results/
    exit "$status"
  ' ci-local "$@"
