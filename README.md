# MML Avatar Tools

This repository contains a collection of tools for working with avatars intended 
to be compatible with the MML ecosystem across both web (e.g. THREE.js) and game
engines.

# Web Apps
## [Avatar Exporter Web App](https://mml-io.github.io/avatar-tools/main/tools/gltf-avatar-exporter/)

The gLTF Avatar Exporter is a tool for fixing mesh, skeleton and 
texture/material issues in avatars exported from various art tools.

It is provided as a web application that runs all processing directly in the 
browser, allowing you to:
* Drag and drop the input file (gLTF / GLB / FBX) into the browser
* Preview the corrected avatar asset with an animation to confirm the skeleton 
  is working as expected
* Download/export the file as a GLB from the browser

The web app is available at the following URL: \
[https://mml-io.github.io/avatar-tools/main/tools/gltf-avatar-exporter/](https://mml-io.github.io/avatar-tools/main/tools/gltf-avatar-exporter/)


# CLIs

To use the CLIs in this repository, you must first build the packages using the 
following commands:

```bash
npm install
npm run build
```

## Avatar Exporter CLI

The gLTF Avatar Exporter is also available as a command line tool to enable 
batch processing of avatars.

This will build all of the packages in the repository, including the 
`gltf-avatar-exporter-cli` package. Once built, you can use the tool to process 
avatars using the following command from the root of this repository:

```bash
npm run convert -- -i <input file> -o <output file>
```

The CLI tool supports skipping [correction steps](./packages/gltf-avatar-export-lib/src/correction-steps/) 
by name:
```bash
# Skip the "remove-transparency-from-materials" step
npm run convert -- -i <input file> -o <output file> --skip-remove-transparency-from-materials
```

## Animation Cleaner CLI

The Animation Cleaner CLI is a tool for cleaning up gLTF files that are intended
to contain just animations, but also happen to contain meshes. This tool 
takes a gLTF/GLB file as input and outputs a new gLTF/GLB file with only the 
necessary bones and animations.

```bash
npm run clean-animation -- -i <input file> -o <output file>
```

## DRACO Encoder CLI

The DRACO Encoder CLI is a tool for encoding gLTF / GLB files with DRACO 
compression to reduce file size.

```bash
npm run draco-encode -- -i <input file> -o <output file>
```
