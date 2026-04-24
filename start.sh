#!/bin/bash

# ============================================================================
# AI Youth Sports League Manager - Startup Script
# ============================================================================

# ---- Colors ----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ---- Helper functions ----
info()    { echo -e "${BLUE}[INFO]${NC}  $1"; }
success() { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; }
step()    { echo -e "\n${MAGENTA}${BOLD}▸ $1${NC}"; }

# ---- Resolve script directory ----
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ---- Track child PIDs ----
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  warn "Shutting down..."
  if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null
    success "Backend stopped (PID $BACKEND_PID)"
  fi
  if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID" 2>/dev/null
    success "Frontend stopped (PID $FRONTEND_PID)"
  fi
  success "Cleanup complete. Goodbye!"
  exit 0
}

trap cleanup SIGINT SIGTERM

# ============================================================================
# Banner
# ============================================================================
echo -e "${CYAN}${BOLD}"
cat << 'BANNER'

     ___   ___   __   __            _   _       ____                  _
    / _ \ |_ _|  \ \ / /__  _   _ | |_| |__   / ___| _ __   ___  _ __| |_ ___
   / /_\ \ | |    \ V / _ \| | | || __| '_ \  \___ \| '_ \ / _ \| '__| __/ __|
  / ___  | | |     | | (_) | |_| || |_| | | |  ___) | |_) | (_) | |  | |_\__ \
 /_/   \_\|___|    |_|\___/ \__,_| \__|_| |_| |____/| .__/ \___/|_|   \__|___/
                                                     |_|
  _                                  __  __
 | |    ___  __ _  __ _ _   _  ___  |  \/  | __ _ _ __   __ _  __ _  ___ _ __
 | |   / _ \/ _` |/ _` | | | |/ _ \ | |\/| |/ _` | '_ \ / _` |/ _` |/ _ \ '__|
 | |__|  __/ (_| | (_| | |_| |  __/ | |  | | (_| | | | | (_| | (_| |  __/ |
 |_____\___|\__,_|\__, |\__,_|\___| |_|  |_|\__,_|_| |_|\__,_|\__, |\___|_|
                   |___/                                        |___/

BANNER
echo -e "${NC}"
echo -e "  ${GREEN}${BOLD}AI-Powered Youth Sports League Management System${NC}"
echo -e "  ${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ============================================================================
# Load environment
# ============================================================================
step "Loading environment variables"

if [ -f "$SCRIPT_DIR/.env" ]; then
  set -a
  source "$SCRIPT_DIR/.env"
  set +a
  success "Loaded .env from $SCRIPT_DIR/.env"
else
  warn ".env file not found at $SCRIPT_DIR/.env — using defaults"
fi

DB_NAME="${DB_NAME:-youth_sports_league}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
BACKEND_PORT="${BACKEND_PORT:-3001}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

# ============================================================================
# Kill existing processes on our ports
# ============================================================================
step "Cleaning up ports $FRONTEND_PORT and $BACKEND_PORT"

for PORT in $FRONTEND_PORT $BACKEND_PORT; do
  PIDS=$(lsof -ti:"$PORT" 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    echo "$PIDS" | xargs kill -9 2>/dev/null || true
    success "Killed processes on port $PORT"
  else
    info "Port $PORT is free"
  fi
done

# ============================================================================
# PostgreSQL
# ============================================================================
step "Checking PostgreSQL"

pg_running() {
  pg_isready -h "$DB_HOST" -p "$DB_PORT" >/dev/null 2>&1
}

if pg_running; then
  success "PostgreSQL is already running"
else
  warn "PostgreSQL is not running. Attempting to start..."
  if command -v brew >/dev/null 2>&1; then
    brew services start postgresql@14 2>/dev/null || \
    brew services start postgresql@15 2>/dev/null || \
    brew services start postgresql@16 2>/dev/null || \
    brew services start postgresql 2>/dev/null || true
  elif command -v pg_ctl >/dev/null 2>&1; then
    pg_ctl -D /usr/local/var/postgres start -l /tmp/pg.log 2>/dev/null || \
    pg_ctl -D /opt/homebrew/var/postgres start -l /tmp/pg.log 2>/dev/null || true
  else
    error "Cannot find a way to start PostgreSQL. Please start it manually."
    exit 1
  fi

  # Wait up to 15 seconds
  info "Waiting for PostgreSQL to be ready..."
  for i in $(seq 1 15); do
    if pg_running; then
      break
    fi
    sleep 1
  done

  if pg_running; then
    success "PostgreSQL is now running"
  else
    error "PostgreSQL failed to start within 15 seconds."
    error "Please start PostgreSQL manually and re-run this script."
    exit 1
  fi
fi

# ============================================================================
# Database setup
# ============================================================================
step "Setting up database"

# Create database if it doesn't exist
createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" 2>/dev/null && \
  success "Created database '$DB_NAME'" || \
  info "Database '$DB_NAME' already exists"

# Run schema
if [ -f "$SCRIPT_DIR/backend/src/db/schema.sql" ]; then
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCRIPT_DIR/backend/src/db/schema.sql" -q 2>/dev/null
  success "Schema applied"
else
  warn "schema.sql not found — skipping"
fi

# Run seed data
if [ -f "$SCRIPT_DIR/backend/src/db/seed.sql" ]; then
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCRIPT_DIR/backend/src/db/seed.sql" -q 2>/dev/null
  success "Seed data loaded"
else
  warn "seed.sql not found — skipping"
fi

# ============================================================================
# Backend
# ============================================================================
step "Starting backend server"

cd "$SCRIPT_DIR/backend"

if [ ! -d "node_modules" ]; then
  info "Installing backend dependencies..."
  npm install
  success "Backend dependencies installed"
else
  info "Backend node_modules found — skipping install"
fi

info "Launching backend with nodemon on port $BACKEND_PORT..."
npx nodemon src/index.js &
BACKEND_PID=$!
success "Backend started (PID $BACKEND_PID)"

cd "$SCRIPT_DIR"

# ============================================================================
# Frontend
# ============================================================================
step "Starting frontend dev server"

cd "$SCRIPT_DIR/frontend"

if [ ! -d "node_modules" ]; then
  info "Installing frontend dependencies..."
  npm install
  success "Frontend dependencies installed"
else
  info "Frontend node_modules found — skipping install"
fi

info "Launching frontend on port $FRONTEND_PORT..."
PORT=$FRONTEND_PORT BROWSER=none npm start &
FRONTEND_PID=$!
success "Frontend started (PID $FRONTEND_PID)"

cd "$SCRIPT_DIR"

# ============================================================================
# Status
# ============================================================================
echo ""
echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}${BOLD}  All services are starting up!${NC}"
echo -e "${CYAN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${BOLD}Frontend:${NC}  ${CYAN}http://localhost:${FRONTEND_PORT}${NC}"
echo -e "  ${BOLD}Backend:${NC}   ${CYAN}http://localhost:${BACKEND_PORT}${NC}"
echo -e "  ${BOLD}API Health:${NC} ${CYAN}http://localhost:${BACKEND_PORT}/api/health${NC}"
echo ""
echo -e "  ${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""
echo -e "  ${BLUE}Backend uses nodemon — auto-reloads on file changes${NC}"
echo -e "  ${BLUE}Frontend uses react-scripts — auto-reloads on file changes${NC}"
echo ""

# ============================================================================
# Wait for processes
# ============================================================================
wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
