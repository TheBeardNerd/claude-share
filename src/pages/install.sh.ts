import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ request }) => {
  const siteUrl = import.meta.env.PUBLIC_SITE_URL;

  const script = `#!/usr/bin/env sh
set -euf

SITE_URL="${siteUrl}"
TYPE="\${1:-}"
SLUG="\${2:-}"

if [ -z "$TYPE" ] || [ -z "$SLUG" ]; then
  printf 'Usage: curl -fsSL %s/install.sh | sh -s -- <type> <slug>\\n' "$SITE_URL"
  printf '  type: skill | command | agent\\n'
  exit 1
fi

case "$SLUG" in
  *[!a-z0-9-]*|''|-*|*-)
    printf 'Invalid slug: %s\\n' "$SLUG"
    exit 1
    ;;
esac

case "$TYPE" in
  skill)   DEST_DIR="\${HOME}/.claude/skills/"   EXT="yaml" ;;
  command) DEST_DIR="\${HOME}/.claude/commands/" EXT="md" ;;
  agent)   DEST_DIR=".claude/agents/"           EXT="yaml" ;;
  *)
    printf 'Unknown artifact type: %s\\n' "$TYPE"
    exit 1
    ;;
esac

RESPONSE=\$(curl -fsSL "\${SITE_URL}/api/artifacts/\${SLUG}")

if command -v jq >/dev/null 2>&1; then
  CONTENT=\$(printf '%s' "$RESPONSE" | jq -r '.content')
elif command -v python3 >/dev/null 2>&1; then
  CONTENT=\$(printf '%s' "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['content'],end='')")
elif command -v python >/dev/null 2>&1; then
  CONTENT=\$(printf '%s' "$RESPONSE" | python -c "import sys,json; print(json.load(sys.stdin)['content'],end='')")
else
  printf 'Error: jq or python is required.\\n'
  exit 1
fi

mkdir -p "$DEST_DIR"
DEST_FILE="\${DEST_DIR}\${SLUG}.\${EXT}"

if [ -f "$DEST_FILE" ]; then
  printf 'File already exists at %s. Overwrite? [y/N] ' "$DEST_FILE"
  read -r CONFIRM </dev/tty
  case "$CONFIRM" in
    [yY]) ;;
    *) printf 'Aborted.\\n'; exit 0 ;;
  esac
fi

printf '%s' "$CONTENT" > "$DEST_FILE"
printf 'Installed: %s\\n' "$DEST_FILE"
`;

  return new Response(script, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-store',
    },
  });
};
