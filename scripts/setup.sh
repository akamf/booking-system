#!/usr/bin/env bash
# First-time setup. Verifies the toolchain, installs deps,
# starts local Supabase, applies migrations, generates types.
set -euo pipefail

cd "$(dirname "$0")/.."

step() { printf '\n\033[1;34m▶ %s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m✓ %s\033[0m\n' "$*"; }
fail() { printf '\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

step "Verifying toolchain"

command -v node >/dev/null 2>&1 || fail "Node.js not found. Install Node 24 (see .nvmrc)."
node_major="$(node -p 'process.versions.node.split(".")[0]')"
[ "$node_major" -ge 24 ] || fail "Node $node_major detected; need >= 24. Try \`nvm use\`."
ok "Node $(node --version)"

command -v pnpm >/dev/null 2>&1 || fail "pnpm not found. Try \`corepack enable\`."
ok "pnpm $(pnpm --version)"

command -v docker >/dev/null 2>&1 || fail "Docker not found. Required for local Supabase."
docker info >/dev/null 2>&1 || fail "Docker daemon not running."
ok "Docker available"

step "Installing dependencies"
pnpm install

if [ -d "supabase/migrations" ] && [ -n "$(ls -A supabase/migrations 2>/dev/null || true)" ]; then
  step "Starting local Supabase (this may take a minute on first run)"
  pnpm db:start

  step "Applying migrations and seed"
  pnpm db:reset

  step "Generating TypeScript types from DB"
  pnpm db:types
else
  ok "No migrations yet — skipping database steps. Run again after Phase 1 lands."
fi

step "Done. Try \`pnpm dev\` next."
