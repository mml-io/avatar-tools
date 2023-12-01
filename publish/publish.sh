#!/usr/bin/env bash

# Exit on error and echo each command
set -ex

# Set the working directory to the location of this script
cd "$(dirname "$0")"

# Create the build directory
mkdir -p ./build/tools

# Copy the index.html file that references the different tools into the build directory
cp ./index.html ./build/index.html

# Copy the files for each tool into the build directory
cp -r ../tools/gltf-avatar-exporter/build ./build/tools/gltf-avatar-exporter
