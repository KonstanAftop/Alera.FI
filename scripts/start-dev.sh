#!/usr/bin/env bash
# Start frontend (Vite) and backend (FastAPI) from repository root.

set -e
cd "$(dirname "$0")/.."

echo "Cleaning up common dev ports..."
lsof -ti:8005,5173,8080,8081 2>/dev/null | xargs kill -9 2>/dev/null || true

echo "Starting backend..."
if [ -d ".venv" ]; then
  # shellcheck source=/dev/null
  source .venv/bin/activate
else
  echo "Warning: .venv not found. Run: python3 -m venv .venv && source .venv/bin/activate && pip install -r backend/requirements.txt"
fi

pip install -r backend/requirements.txt --quiet 2>/dev/null || pip install -r backend/requirements.txt

python3 backend/main.py &
BACKEND_PID=$!
echo "Backend PID $BACKEND_PID (http://localhost:8005)"

echo "Starting frontend..."
if command -v bun &>/dev/null; then
  bun run dev &
else
  npm run dev &
fi
FRONTEND_PID=$!
echo "Frontend PID $FRONTEND_PID (see Vite output for URL, often http://localhost:8080)"

cleanup() {
  echo "Shutting down..."
  kill "$BACKEND_PID" 2>/dev/null || true
  kill "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup SIGINT SIGTERM

wait
