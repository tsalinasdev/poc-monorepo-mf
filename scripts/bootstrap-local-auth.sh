#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# bootstrap-local-auth.sh
# ---------------------------------------------------------------------------
# Configura la auth del registry privado de Talana (Talanify) en el
# ~/.npmrc del usuario para que `pnpm install` funcione localmente sin
# tener el _authToken en el .npmrc del repo (ni commiteado ni visible).
#
# Tres modos:
#   1. Token estático (passa como argumento):
#        ./scripts/bootstrap-local-auth.sh ya29.abc...
#
#   2. Token gcloud OAuth del usuario actual (gcloud CLI instalado):
#        ./scripts/bootstrap-local-auth.sh
#        (genera un access token con `gcloud auth print-access-token`).
#
#   3. CI / scripts headless: en lugar de este script, setea la variable de
#      entorno NPM_CONFIG_TALANA_TOKEN antes de `pnpm install` y que el
#      bootstrap del runner la inyecte en ~/.npmrc. Ver .github/workflows/.
# ---------------------------------------------------------------------------

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="us-central1-npm.pkg.dev"
REPO="linq-1350"
PROJECT="frontend"
KEY="//${HOST}/${REPO}/${PROJECT}/:_authToken"
LINE="${KEY}=${TOKEN:-}"

# 1. Argumento: token estático pasado directo.
if [ $# -ge 1 ]; then
  TOKEN="$1"
fi

# 2. Sin argumento: intentar con gcloud (dev local con gcloud CLI).
if [ -z "${TOKEN:-}" ] && command -v gcloud >/dev/null 2>&1; then
  echo "→ Generando access token con 'gcloud auth print-access-token'…"
  TOKEN="$(gcloud auth print-access-token)"
fi

if [ -z "${TOKEN:-}" ]; then
  cat <<EOF >&2
ERROR: no se pudo obtener un token. Opciones:
  - Pasá el token como argumento:   $0 ya29.abc...
  - Instalá gcloud CLI y corré:      gcloud auth login
  - En CI: seteá la variable de entorno NPM_CONFIG_TALANA_TOKEN antes de
    'pnpm install' y que el runner la inyecte en ~/.npmrc.

EOF
  exit 1
fi

# 3. Inyectar en ~/.npmrc (o crear el archivo). Reemplaza la línea si ya
#    existe, o la agrega.
NPMRC="${HOME}/.npmrc"
touch "$NPMRC"

if grep -qF "$KEY" "$NPMRC"; then
  # macOS/BSD sed y GNU sed son incompatibles; uso awk que funciona en ambos.
  TMP="$(mktemp)"
  awk -v key="$KEY" -v value="$TOKEN" '
    index($0, key) == 1 { print key "=" value; next }
    { print }
  ' "$NPMRC" > "$TMP"
  mv "$TMP" "$NPMRC"
else
  printf '\n%s=%s\n' "$KEY" "$TOKEN" >> "$NPMRC"
fi

echo "OK: token escrito en $NPMRC (longitud: ${#TOKEN}). Probá: pnpm install"
