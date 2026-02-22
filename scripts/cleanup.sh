#!/usr/bin/env bash
# =============================================================================
# DRIIVA — Repository Cleanup Script
# =============================================================================
# Removes Supabase, Replit, Drizzle/Postgres and legacy backup artefacts.
# Run from the project root:
#   chmod +x scripts/cleanup.sh
#   ./scripts/cleanup.sh
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      DRIIVA Repository Cleanup           ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo ""

# =============================================================================
# STEP 1: CRITICAL — Remove credentials from git history
# =============================================================================
echo -e "${RED}[CRITICAL] Purging test-auth.js from git history...${NC}"

if git log --oneline -- test-auth.js | grep -q '.'; then
  git filter-branch --force --index-filter \
    'git rm --cached --ignore-unmatch test-auth.js' \
    --prune-empty --tag-name-filter cat -- --all

  rm -rf .git/refs/original/
  git reflog expire --expire=now --all
  git gc --prune=now --aggressive

  echo -e "${GREEN}✓ test-auth.js purged from git history${NC}"
  echo -e "${YELLOW}  ⚠ You must run: git push origin --force --all${NC}"
  echo -e "${YELLOW}  ⚠ Notify all collaborators to re-clone the repo${NC}"
else
  echo -e "${YELLOW}  test-auth.js not found in git history, skipping${NC}"
fi
echo ""

# =============================================================================
# STEP 2: Remove Supabase artefacts
# =============================================================================
echo -e "${BLUE}[Supabase] Removing Supabase files...${NC}"

SUPABASE_FILES=(
  "test-auth.js"
  "AUTH_TROUBLESHOOTING.md"
  "supabase"
)

for f in "${SUPABASE_FILES[@]}"; do
  if [ -e "$f" ]; then
    rm -rf "$f"
    echo -e "${GREEN}  ✓ Removed: $f${NC}"
  else
    echo -e "${YELLOW}  - Not found (already removed): $f${NC}"
  fi
done
echo ""

# =============================================================================
# STEP 3: Remove Replit artefacts
# =============================================================================
echo -e "${BLUE}[Replit] Removing Replit files...${NC}"

REPLIT_FILES=(
  ".replit"
  "replit.md"
  "replit.nix"
)

for f in "${REPLIT_FILES[@]}"; do
  if [ -e "$f" ]; then
    rm -rf "$f"
    echo -e "${GREEN}  ✓ Removed: $f${NC}"
  else
    echo -e "${YELLOW}  - Not found: $f${NC}"
  fi
done
echo ""

# =============================================================================
# STEP 4: Remove Drizzle/Postgres/Python artefacts
# =============================================================================
echo -e "${BLUE}[Drizzle/Python] Removing ORM and Python files...${NC}"

DRIZZLE_FILES=(
  "drizzle.config.ts"
  "migrations"
  "pyproject.toml"
  "main.py"
  "functions-python"
  "uv.lock"
)

for f in "${DRIZZLE_FILES[@]}"; do
  if [ -e "$f" ]; then
    rm -rf "$f"
    echo -e "${GREEN}  ✓ Removed: $f${NC}"
  else
    echo -e "${YELLOW}  - Not found: $f${NC}"
  fi
done
echo ""

# =============================================================================
# STEP 5: Remove legacy backup and doc files
# =============================================================================
echo -e "${BLUE}[Legacy] Removing backup and legacy docs...${NC}"

LEGACY_FILES=(
  "STABLE_VERSION_1_BACKUP.md"
  "STABLE_VERSION_2_2_BACKUP.md"
  "REFACTOR_DIFF_SUMMARY.md"
  "LOGIN_FIX_SUMMARY.md"
  "DRIIVA_DEBUG_ANALYSIS.md"
  "DRIIVA_COMPLETE_CODE.md"
  "firebase-debug.log"
  "check-user.js"
  "create-user.js"
  "ask-claude.js"
)

for f in "${LEGACY_FILES[@]}"; do
  if [ -e "$f" ]; then
    rm -rf "$f"
    echo -e "${GREEN}  ✓ Removed: $f${NC}"
  else
    echo -e "${YELLOW}  - Not found: $f${NC}"
  fi
done
echo ""

# =============================================================================
# STEP 6: Scan for lingering Supabase imports
# =============================================================================
echo -e "${BLUE}[Scan] Checking for remaining Supabase references in source...${NC}"

SUPABASE_REFS=$(grep -r "supabase\|SUPABASE\|@supabase\|createClient" \
  --include="*.ts" --include="*.tsx" --include="*.js" \
  --exclude-dir=node_modules --exclude-dir=.git \
  -l 2>/dev/null || true)

if [ -n "$SUPABASE_REFS" ]; then
  echo -e "${RED}  ⚠ Supabase references still found in:${NC}"
  echo "$SUPABASE_REFS" | while read -r line; do
    echo -e "${RED}    - $line${NC}"
  done
  echo -e "${YELLOW}  Run: grep -r 'supabase\\|SUPABASE\\|@supabase' --include='*.ts' --include='*.tsx' --exclude-dir=node_modules${NC}"
else
  echo -e "${GREEN}  ✓ No Supabase references found in source files${NC}"
fi
echo ""

# =============================================================================
# STEP 7: Scan for VITE_ANTHROPIC or other leaked secrets
# =============================================================================
echo -e "${BLUE}[Security] Checking for leaked API keys in client env vars...${NC}"

SECRET_REFS=$(grep -r "VITE_ANTHROPIC\|VITE_ROOT_API\|VITE_STRIPE\|VITE_SENTRY" \
  --include="*.ts" --include="*.tsx" --include="*.env*" \
  --exclude-dir=node_modules --exclude-dir=.git \
  -l 2>/dev/null || true)

if [ -n "$SECRET_REFS" ]; then
  echo -e "${RED}  ⚠ Potential server-side secrets exposed via VITE_ prefix:${NC}"
  echo "$SECRET_REFS" | while read -r line; do
    echo -e "${RED}    - $line${NC}"
  done
else
  echo -e "${GREEN}  ✓ No server secrets found with VITE_ prefix${NC}"
fi
echo ""

# =============================================================================
# STEP 8: Clean npm artefacts and reinstall
# =============================================================================
echo -e "${BLUE}[npm] Removing Supabase/Replit packages from root package.json...${NC}"
echo -e "${YELLOW}  Note: Manually remove these from package.json if present:${NC}"
echo -e "${YELLOW}    - @supabase/supabase-js${NC}"
echo -e "${YELLOW}    - @replit/vite-plugin-runtime-error-modal${NC}"
echo -e "${YELLOW}    - @replit/vite-plugin-cartographer${NC}"
echo -e "${YELLOW}  Then run: npm install${NC}"
echo ""

echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         Cleanup complete! ✓              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "${RED}MANDATORY next steps:${NC}"
echo -e "  1. git push origin --force --all"
echo -e "  2. Rotate password for jamal@driiva.co.uk in Firebase console"
echo -e "  3. Review and commit vite.config.ts (Replit plugins removed)"
echo -e "  4. Run: npm install (after removing Supabase deps from package.json)"
