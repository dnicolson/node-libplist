#!/bin/bash

set -e

# Ensure libplist source exists before building
# Downloads latest version if not present

if [ ! -d "libplist" ]; then
    echo "📦 libplist directory not found, downloading..."
    ./scripts/download-libplist.sh
else
    echo "✅ libplist directory exists"
fi
