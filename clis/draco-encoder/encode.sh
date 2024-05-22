#!/usr/bin/env bash

# Run "node ./build/index.js -i <input> -o <output>" for all files in the "./in" directory and save the output to the "./out" directory.

# The directory contains nested directories, so we need to find all files recursively.

# Create the output directory if it doesn't exist
mkdir -p ./out

# Find all files recursively in the ./in directory
find ./in -type f | while read -r inputFile; do
  # Get the relative path of the input file
  relativePath="${inputFile#./in/}"

  # Make sure the output directory structure exists
  outputDir="./out/$(dirname "$relativePath")"
  mkdir -p "$outputDir"

  # Define the output file path
  outputFile="$outputDir/$(basename "$relativePath")"

  # Run the node script with the input and output file paths
  node ./build/index.js -i "$inputFile" -o "$outputFile"
done
