#!/usr/bin/env bash
# macOS/Linux equivalent of "Start Forge.bat".
# Run with: ./start.sh   (or: bash start.sh)
set -e

cd "$(dirname "${BASH_SOURCE[0]}")"

if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js/npm was not found on PATH. Install Node.js 20+ from https://nodejs.org and try again."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies, this only happens once..."
  npm install
fi

echo "Starting Forge... your browser will open automatically."
echo "Keep this terminal open while using the app. Press Ctrl+C to stop the server."
npm run launch
