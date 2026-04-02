#!/bin/bash
pkill -f "electron" 2>/dev/null
cd "$(dirname "$0")"
npx vite build
npx electron .
