#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# dev.sh — Enterprise Concurrent Dev Runner for Resumind
#
# Runs Next.js frontend (port 3000) and Go backend (port 8080) simultaneously.
# Handles graceful shutdown on Ctrl+C (SIGINT/SIGTERM), cleans up all child
# process trees and ensures ports are freed without leaving orphan processes.
# Compatible with macOS default Bash 3.2, modern Bash 5, and Zsh.
# ─────────────────────────────────────────────────────────────────────────────
set -u

# ── Paths & Config ───────────────────────────────────────────────────────────
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_DIR="$ROOT_DIR/backend"

FRONTEND_PORT=3000
BACKEND_PORT=8080
SHUTDOWN_TIMEOUT=5

# ── Colors & Formatting ──────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

# ── State ────────────────────────────────────────────────────────────────────
FRONTEND_PID=""
BACKEND_PID=""
CLEANUP_DONE=0

# ── Logging Functions ────────────────────────────────────────────────────────
log_header() {
  echo ""
  echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════╗${RESET}"
  echo -e "${BOLD}${CYAN}║${RESET}  ${BOLD}🚀 Resumind Unified Development Server${RESET}                      ${BOLD}${CYAN}║${RESET}"
  echo -e "${BOLD}${CYAN}╠══════════════════════════════════════════════════════════════╣${RESET}"
  echo -e "${BOLD}${CYAN}║${RESET}  ${GREEN}▸ Frontend${RESET}  Next.js   → ${BOLD}http://localhost:${FRONTEND_PORT}${RESET}             ${BOLD}${CYAN}║${RESET}"
  echo -e "${BOLD}${CYAN}║${RESET}  ${BLUE}▸ Backend${RESET}   Go/Chi    → ${BOLD}http://localhost:${BACKEND_PORT}${RESET}             ${BOLD}${CYAN}║${RESET}"
  echo -e "${BOLD}${CYAN}╠══════════════════════════════════════════════════════════════╣${RESET}"
  echo -e "${BOLD}${CYAN}║${RESET}  ${DIM}Press ${BOLD}Ctrl + C${RESET}${DIM} anytime to cleanly stop both services${RESET}       ${BOLD}${CYAN}║${RESET}"
  echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════╝${RESET}"
  echo ""
}

log_info()    { echo -e "${DIM}[$(date +%H:%M:%S)]${RESET} ${CYAN}ℹ${RESET}  $1"; }
log_success() { echo -e "${DIM}[$(date +%H:%M:%S)]${RESET} ${GREEN}✔${RESET}  $1"; }
log_warn()    { echo -e "${DIM}[$(date +%H:%M:%S)]${RESET} ${YELLOW}⚠${RESET}  $1"; }
log_error()   { echo -e "${DIM}[$(date +%H:%M:%S)]${RESET} ${RED}✖${RESET}  $1"; }

# Stream prefixer for child output
prefix_stream() {
  local label="$1"
  local color="$2"
  while IFS= read -r line || [ -n "$line" ]; do
    printf "${DIM}[%s]${RESET} %b%s%b │ %s\n" "$(date +%H:%M:%S)" "$color" "$label" "$RESET" "$line"
  done
}

# ── Process & Port Cleanup Utilities ─────────────────────────────────────────
# Recursively kill a process and all its children
kill_process_tree() {
  local parent_pid="$1"
  local sig="${2:-TERM}"

  if [ -z "$parent_pid" ] || ! kill -0 "$parent_pid" 2>/dev/null; then
    return
  fi

  # Find child processes recursively
  local children
  children=$(pgrep -P "$parent_pid" 2>/dev/null || true)
  for child in $children; do
    kill_process_tree "$child" "$sig"
  done

  kill -"$sig" "$parent_pid" 2>/dev/null || true
}

# Terminate any process currently bound to a port
free_port() {
  local port="$1"
  if command -v lsof &>/dev/null; then
    local pids
    pids=$(lsof -ti :"$port" 2>/dev/null || true)
    if [ -n "$pids" ]; then
      for p in $pids; do
        kill -TERM "$p" 2>/dev/null || true
      done
      sleep 0.3
      pids=$(lsof -ti :"$port" 2>/dev/null || true)
      if [ -n "$pids" ]; then
        for p in $pids; do
          kill -9 "$p" 2>/dev/null || true
        done
      fi
    fi
  fi
}

# ── Graceful Shutdown Handler ────────────────────────────────────────────────
cleanup() {
  # Prevent re-entry if called by multiple signals
  if [ "$CLEANUP_DONE" -eq 1 ]; then
    return
  fi
  CLEANUP_DONE=1

  echo ""
  echo -e "${BOLD}${YELLOW}┌──────────────────────────────────────────────────────────────┐${RESET}"
  echo -e "${BOLD}${YELLOW}│  🛑  Shutting down services gracefully (Ctrl+C received)...  │${RESET}"
  echo -e "${BOLD}${YELLOW}└──────────────────────────────────────────────────────────────┘${RESET}"

  # 1. Terminate frontend process tree
  if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    log_info "Stopping Next.js Frontend (PID: $FRONTEND_PID)..."
    kill_process_tree "$FRONTEND_PID" TERM
  fi

  # 2. Terminate backend process tree
  if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    log_info "Stopping Go Backend (PID: $BACKEND_PID)..."
    kill_process_tree "$BACKEND_PID" TERM
  fi

  # 3. Wait up to SHUTDOWN_TIMEOUT seconds for processes to exit
  local waited=0
  while [ $waited -lt $SHUTDOWN_TIMEOUT ]; do
    local alive=0
    if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then alive=1; fi
    if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then alive=1; fi
    if [ "$alive" -eq 0 ]; then
      break
    fi
    sleep 0.5
    waited=$((waited + 1))
  done

  # 4. Force-kill if any are still lingering
  if [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    log_warn "Force-killing frontend PID $FRONTEND_PID..."
    kill_process_tree "$FRONTEND_PID" 9
  fi

  if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    log_warn "Force-killing backend PID $BACKEND_PID..."
    kill_process_tree "$BACKEND_PID" 9
  fi

  # 5. Guarantee ports are liberated (fail-safe for EADDRINUSE)
  free_port "$FRONTEND_PORT"
  free_port "$BACKEND_PORT"

  log_success "${BOLD}All services cleanly stopped. Goodbye!${RESET}\n"
  exit 0
}

# ── Prerequisite Verification ────────────────────────────────────────────────
check_prerequisites() {
  local has_error=0

  if ! command -v go &>/dev/null; then
    log_error "Go compiler is not installed or not in PATH."
    has_error=1
  fi

  if ! command -v npm &>/dev/null && ! command -v bun &>/dev/null; then
    log_error "Neither npm nor bun is installed."
    has_error=1
  fi

  if [ ! -d "$FRONTEND_DIR" ]; then
    log_error "Frontend directory does not exist: $FRONTEND_DIR"
    has_error=1
  fi

  if [ ! -d "$BACKEND_DIR" ]; then
    log_error "Backend directory does not exist: $BACKEND_DIR"
    has_error=1
  fi

  if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    log_warn "frontend/node_modules not found. Run 'make install' or 'cd frontend && npm install' if dependencies are missing."
  fi

  if [ "$has_error" -eq 1 ]; then
    echo -e "${RED}Prerequisite check failed. Please resolve above issues.${RESET}\n"
    exit 1
  fi

  # Check if ports 3000 or 8080 are currently trapped by previous orphan processes
  if command -v lsof &>/dev/null; then
    if lsof -ti :"$FRONTEND_PORT" &>/dev/null; then
      log_warn "Port $FRONTEND_PORT is already in use by an old process. Cleaning up..."
      free_port "$FRONTEND_PORT"
    fi
    if lsof -ti :"$BACKEND_PORT" &>/dev/null; then
      log_warn "Port $BACKEND_PORT is already in use by an old process. Cleaning up..."
      free_port "$BACKEND_PORT"
    fi
  fi
}

# ── Main Entry ───────────────────────────────────────────────────────────────
main() {
  # Register traps for clean termination on Ctrl+C, kill, or exit
  trap 'cleanup' INT TERM HUP

  log_header
  check_prerequisites

  # Detect JS package runner (bun if available, else npm)
  local js_runner="npm"
  if command -v bun &>/dev/null; then
    js_runner="bun"
  fi

  # 1. Launch Backend (Go)
  log_info "Starting ${BOLD}Go Backend${RESET} (http://localhost:${BACKEND_PORT})..."
  exec 3> >(prefix_stream "backend " "$BLUE")

  # Use air if installed, otherwise go run ./cmd/server
  if command -v air &>/dev/null; then
    ( cd "$BACKEND_DIR" && exec air ) >&3 2>&3 &
  else
    ( cd "$BACKEND_DIR" && exec go run ./cmd/server ) >&3 2>&3 &
  fi
  BACKEND_PID=$!
  exec 3>&-
  log_success "Go Backend launched with PID ${BACKEND_PID}"

  # Give backend a moment to initialize before frontend starts
  sleep 1

  # 2. Launch Frontend (Next.js)
  log_info "Starting ${BOLD}Next.js Frontend${RESET} (http://localhost:${FRONTEND_PORT}) using ${js_runner}..."
  exec 4> >(prefix_stream "frontend" "$GREEN")
  ( cd "$FRONTEND_DIR" && exec "$js_runner" run dev ) >&4 2>&4 &
  FRONTEND_PID=$!
  exec 4>&-
  log_success "Next.js Frontend launched with PID ${FRONTEND_PID}"

  echo ""
  log_info "${BOLD}Development server is active.${RESET} Aggregating live logs below:"
  echo -e "${DIM}─────────────────────────────────────────────────────────────────${RESET}"

  # Wait for both processes; if user presses Ctrl+C, the trap triggers cleanup()
  # In Bash 3.2+, waiting on both PIDs blocks until a signal arrives or both exit.
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true

  # If wait ends without a signal (e.g. one crashed or exited), run cleanup
  cleanup
}

main "$@"
