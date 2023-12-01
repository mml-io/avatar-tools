#!/usr/bin/env bash

# Exit on error and echo each command
set -ex

mkdir -p ./build/tools

cp ./index.html ./build/index.html

# Copy the files for each tool into the build directory
cp -r ../tools/gltf-avatar-exporter/build ./build/tools/gltf-avatar-exporter
