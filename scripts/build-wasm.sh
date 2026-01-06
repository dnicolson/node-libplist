#!/bin/bash

set -e

# WASM build script for libplist using WASI

WASI_SDK_PATH=${WASI_SDK_PATH:-"/opt/wasi-sdk"}

echo "Building libplist to WASM with WASI..."

cd libplist

# Configure and build with WASI
if [ ! -f "configure" ]; then
    echo "Running autogen.sh..."
    ./autogen.sh
fi

# Set WASI environment
export CC="$WASI_SDK_PATH/bin/clang"
export CXX="$WASI_SDK_PATH/bin/clang++"
export AR="$WASI_SDK_PATH/bin/ar"
export RANLIB="$WASI_SDK_PATH/bin/ranlib"
export CFLAGS="--target=wasm32-wasi -O3"
export LDFLAGS="--target=wasm32-wasi"

# Configure with WASI
echo "Configuring libplist for WASI..."
./configure \
    --host=wasm32-wasi \
    --disable-shared \
    --enable-static \
    --without-cython

# Build only what we need
echo "Building libplist..."
make clean
make -C libcnary
make -C src

cd ..

# Create dist directory
mkdir -p dist

# Create WASM module with WASI
echo "Creating WASM module..."
"$WASI_SDK_PATH/bin/clang" \
    --target=wasm32-wasi \
    -O3 \
    -flto \
    -Wl,--no-entry \
    -Wl,--export-dynamic \
    -Wl,--allow-undefined \
    -Wl,--export=plist_parse_to_json \
    -Wl,--export=plist_json_to_xml \
    -Wl,--export=plist_json_to_bin \
    -Wl,--export=plist_bin_to_xml \
    -Wl,--export=plist_xml_to_bin \
    -Wl,--export=plist_is_valid \
    -Wl,--export=malloc \
    -Wl,--export=free \
    -I./libplist/include \
    -I./libplist/src \
    src/plist_wrapper.c \
    libplist/src/.libs/libplist-2.0.a \
    libplist/libcnary/.libs/libcnary.a \
    -o dist/libplist.wasm

rm -rf /tmp/wasi-sdk

echo "WASM build complete! Pure WASM module created at dist/libplist.wasm"
