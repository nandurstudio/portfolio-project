#!/bin/bash
# KKM Smart Vote - Run & Sync to Laragon (Linux/Mac)
# Script location: web/kkmsmartvote/
#
# 🚀 QUICK START:
#    chmod +x run-and-sync.sh
#    ./run-and-sync.sh
#
# OPTIONS:
#    ./run-and-sync.sh --dev                   # Run dev server after sync
#    ./run-and-sync.sh --no-install            # Skip npm install
#    ./run-and-sync.sh --dev --launch-browser  # Open browser

# Parse arguments
DEV=false
NO_INSTALL=false
LAUNCH_BROWSER=false
FRONTEND_PORT=5173

while [[ $# -gt 0 ]]; do
    case $1 in
        --dev) DEV=true; shift ;;
        --no-install) NO_INSTALL=true; shift ;;
        --launch-browser) LAUNCH_BROWSER=true; shift ;;
        --frontend-port) FRONTEND_PORT=$2; shift 2 ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PATH="$SCRIPT_DIR/backend"
FRONTEND_PATH="$SCRIPT_DIR/frontend"
LARAGON_PATH="/path/to/laragon/www/koperasi-vote"

echo -e "${CYAN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   📱 KKM Smart Vote - Run & Sync to Laragon        ║${NC}"
echo -e "${CYAN}║   $(date '+%Y-%m-%d %H:%M:%S')                                 ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════╝${NC}"

# Step 1: Validate directories
echo -e "\n${CYAN}✓ Checking project directories...${NC}"
if [ ! -d "$BACKEND_PATH" ]; then
    echo -e "${RED}❌ Backend path not found: $BACKEND_PATH${NC}"
    exit 1
fi
if [ ! -d "$FRONTEND_PATH" ]; then
    echo -e "${RED}❌ Frontend path not found: $FRONTEND_PATH${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Project structure OK${NC}"

# Step 2: Install Dependencies
echo -e "\n${CYAN}📦 STEP 1: Checking Dependencies${NC}"
echo -e "${CYAN}─────────────────────────────────────${NC}"

if [ "$NO_INSTALL" = true ]; then
    echo -e "${YELLOW}⏭️  Skipping npm install (--no-install)${NC}"
else
    echo "Checking frontend dependencies..."
    if [ ! -d "$FRONTEND_PATH/node_modules" ]; then
        echo -e "${YELLOW}⬇️  Installing npm packages...${NC}"
        cd "$FRONTEND_PATH"
        npm install
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
        else
            echo -e "${YELLOW}⚠️  npm install had warnings (continuing...)${NC}"
        fi
        cd "$SCRIPT_DIR"
    else
        echo -e "${GREEN}✓ Frontend dependencies OK${NC}"
    fi
fi

# Step 3: Note about sync
echo -e "\n${CYAN}🔄 STEP 2: Syncing to Laragon${NC}"
echo -e "${CYAN}─────────────────────────────────────${NC}"

if [ "$OSTYPE" = "msys" ] || [ "$OSTYPE" = "win32" ]; then
    echo -e "${YELLOW}Note: Use the PowerShell version on Windows:${NC}"
    echo "  .\run-and-sync.ps1"
else
    echo -e "${YELLOW}⚠️  Manual sync required on Linux/Mac:${NC}"
    echo "  rsync -av --delete $SCRIPT_DIR/ f:\\laragon\\www\\koperasi-vote\\"
fi

# Step 4: Run Dev Server (if requested)
if [ "$DEV" = true ]; then
    echo -e "\n${CYAN}🚀 STEP 3: Starting Frontend Dev Server${NC}"
    echo -e "${CYAN}─────────────────────────────────────${NC}"
    echo -e "${CYAN}Frontend: http://localhost:$FRONTEND_PORT${NC}"

    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm not found! Install Node.js first.${NC}"
        exit 1
    fi

    cd "$FRONTEND_PATH"
    npm run dev
fi

# Summary
echo -e "\n${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ Setup Complete!                              ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
