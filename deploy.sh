#!/usr/bin/env bash

set -Eeuo pipefail

readonly SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly CLIENT_DIR="${SCRIPT_DIR}/client"
readonly BUILD_DIR="${CLIENT_DIR}/dist/web/browser"

cd -- "${SCRIPT_DIR}"

SSH_HOST="${DEPLOY_SSH_HOST:-team}"
REMOTE_DIR="${DEPLOY_REMOTE_DIR:-/var/www/hallboard.ir}"
readonly SSH_OPTIONS=(-o RemoteCommand=none -o RequestTTY=no)

log() {
  printf '[deploy] %s\n' "$*"
}

fail() {
  printf '[deploy] error: %s\n' "$*" >&2
  exit 1
}

command -v pnpm >/dev/null 2>&1 || fail "pnpm is required but was not found in PATH"
command -v ssh >/dev/null 2>&1 || fail "ssh is required but was not found in PATH"
command -v rsync >/dev/null 2>&1 || fail "rsync is required but was not found in PATH"

[[ -f "${CLIENT_DIR}/pnpm-lock.yaml" ]] || fail "client/pnpm-lock.yaml was not found"

readonly REQUIRED_PNPM_VERSION="$(node -p "require('./client/package.json').packageManager.split('@')[1]")"
PNPM_COMMAND=(pnpm)

if [[ "$(pnpm --version)" != "${REQUIRED_PNPM_VERSION}" ]]; then
  log "Activating pnpm ${REQUIRED_PNPM_VERSION} required by client/package.json"
  command -v corepack >/dev/null 2>&1 || fail "Corepack is required to activate pnpm ${REQUIRED_PNPM_VERSION}"
  corepack install --global "pnpm@${REQUIRED_PNPM_VERSION}"

  COREPACK_CACHE_DIR="${COREPACK_HOME:-${XDG_CACHE_HOME:-${HOME}/.cache}/node/corepack}"
  PNPM_CACHE_BIN="${COREPACK_CACHE_DIR}/v1/pnpm/${REQUIRED_PNPM_VERSION}/bin/pnpm.cjs"
  [[ -f "${PNPM_CACHE_BIN}" ]] || fail "could not locate pnpm ${REQUIRED_PNPM_VERSION} after Corepack installation"
  PNPM_COMMAND=(node "${PNPM_CACHE_BIN}")
fi

log "Installing locked dependencies"
"${PNPM_COMMAND[@]}" --dir "${CLIENT_DIR}" install --frozen-lockfile

log "Building the production browser bundle"
"${PNPM_COMMAND[@]}" --dir "${CLIENT_DIR}" exec ng build web --configuration production

[[ -f "${BUILD_DIR}/index.html" ]] || fail "build completed without ${BUILD_DIR}/index.html"

log "Checking SSH access to ${SSH_HOST}"
ssh "${SSH_OPTIONS[@]}" "${SSH_HOST}" "mkdir -p -- '${REMOTE_DIR}'"

log "Deploying ${BUILD_DIR} to ${SSH_HOST}:${REMOTE_DIR}"
rsync --archive --delete --delete-delay --human-readable --itemize-changes \
  -e "ssh ${SSH_OPTIONS[*]}" \
  "${BUILD_DIR}/" "${SSH_HOST}:${REMOTE_DIR%/}/"

log "Deployment complete"
