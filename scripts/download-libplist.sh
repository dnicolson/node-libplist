#!/bin/bash

set -e

# Script to download and extract a specific version of libplist
# Usage: ./download-libplist.sh [version]
# If no version is specified, downloads the latest release

VERSION="$1"

# If no version specified, get the latest release
if [ -z "$VERSION" ]; then
    echo "No version specified, fetching latest release..."
    VERSION=$(curl -s https://api.github.com/repos/libimobiledevice/libplist/releases/latest | jq -r .tag_name)
    if [ -z "$VERSION" ] || [ "$VERSION" = "null" ]; then
        echo "Error: Could not fetch latest version"
        exit 1
    fi
    echo "Latest version: $VERSION"
fi

echo "Downloading libplist $VERSION"

# Remove old libplist directory if exists
if [ -d "libplist" ]; then
    echo "Removing existing libplist directory..."
    rm -rf libplist
fi

# Download and extract new release
DOWNLOAD_URL="https://github.com/libimobiledevice/libplist/releases/download/${VERSION}/libplist-${VERSION}.tar.bz2"
echo "Downloading from: $DOWNLOAD_URL"

if ! wget -q "$DOWNLOAD_URL"; then
    echo "Error: Failed to download libplist ${VERSION}"
    echo "Please verify the version exists at: https://github.com/libimobiledevice/libplist/releases"
    exit 1
fi

echo "Extracting archive..."
tar xf "libplist-${VERSION}.tar.bz2"
mv "libplist-${VERSION}" libplist
rm "libplist-${VERSION}.tar.bz2"

echo "Successfully downloaded and extracted libplist $VERSION"
echo ""
echo "Next steps:"
echo "  1. Run: npm run build"
echo "  2. Run: npm test"
echo "  3. Update package.json version if needed: npm version $VERSION --no-git-tag-version"
