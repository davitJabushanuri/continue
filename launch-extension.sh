#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_DIR="$SCRIPT_DIR"

export CONTINUE_GLOBAL_DIR="$WORKSPACE_DIR/extensions/.continue-debug"

echo "Building Continue packages..."
cd "$WORKSPACE_DIR"
node ./scripts/build-packages.js

echo "Building GUI..."
cd "$WORKSPACE_DIR/gui"
npm run dev &
GUI_PID=$!

echo "Building extension UI..."
cd "$WORKSPACE_DIR/extensions/vscode"
SKIP_INSTALLS=true node "$WORKSPACE_DIR/extensions/vscode/scripts/prepackage.js"

echo "Building extension with esbuild..."
npm run esbuild-watch &
ESBUILD_PID=$!

echo "Running TypeScript compiler in watch mode..."
cd "$WORKSPACE_DIR"
npm run tsc:watch &
TSC_PID=$!

sleep 3

echo "Launching custom VS Code build with extension..."
cd "$WORKSPACE_DIR/extensions/vscode"

/home/mikef0x/Projects/architech/vscode/scripts/code.sh \
  --extensionDevelopmentPath="$WORKSPACE_DIR/extensions/vscode" \
  --disable-extensions \
  "$WORKSPACE_DIR/manual-testing-sandbox" \
  "$WORKSPACE_DIR/manual-testing-sandbox/test.js"

cleanup() {
    echo "Cleaning up background processes..."
    kill $GUI_PID 2>/dev/null || true
    kill $ESBUILD_PID 2>/dev/null || true
    kill $TSC_PID 2>/dev/null || true
    exit 0
}

trap cleanup SIGINT SIGTERM

wait 