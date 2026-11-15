#!/usr/bin/env bash
# Publish Dungeon of Echoes to GitHub + GitHub Pages. Needs `gh` logged in (gh auth login --web --scopes repo,workflow).
set -euo pipefail
cd "$(dirname "$0")"
gh auth status >/dev/null
OWNER=$(gh api user -q .login)
DESC="Dungeon of Echoes: dark-fantasy real-time dungeon crawler RPG (5 classes, story + endless, 80+ items). Touch, keyboard and gamepad."
NAME=dungeon-of-echoes
if gh repo view "$OWNER/$NAME" >/dev/null 2>&1; then
  if [ "$(gh repo view "$OWNER/$NAME" --json description -q .description)" != "$DESC" ]; then NAME=dungeon-of-echoes-game; fi
fi
URL="https://$OWNER.github.io/$NAME/"
gh repo view "$OWNER/$NAME" >/dev/null 2>&1 || gh repo create "$OWNER/$NAME" --public --description "$DESC" --homepage "$URL"
gh api -X POST "repos/$OWNER/$NAME/pages" -f build_type=workflow >/dev/null 2>&1 || gh api -X PUT "repos/$OWNER/$NAME/pages" -f build_type=workflow >/dev/null
git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/$OWNER/$NAME.git"
gh auth setup-git
git push -u origin main
echo "Repo: https://github.com/$OWNER/$NAME"
sleep 8
RUN=$(gh run list -R "$OWNER/$NAME" --workflow pages.yml --limit 1 --json databaseId -q '.[0].databaseId' || true)
[ -n "${RUN:-}" ] && gh run watch "$RUN" -R "$OWNER/$NAME" --exit-status || true
for i in $(seq 1 40); do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$URL"); [ "$code" = 200 ] && break; sleep 10
done
echo "Pages $URL -> HTTP $code"
JS=$(curl -s "$URL" | grep -o 'assets/index-[A-Za-z0-9_-]*\.js' | head -1)
echo "JS $JS -> HTTP $(curl -s -o /dev/null -w "%{http_code}" "$URL$JS")"
