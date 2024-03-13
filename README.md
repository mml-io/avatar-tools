# MML Avatar Tools

This repository contains a collection of tools for working with avatars intended to be compatible with the MML 
ecosystem across both web (e.g. THREE.js) and game engines. 

# [Avatar Exporter Web App](https://mml-io.github.io/avatar-tools/main/tools/gltf-avatar-exporter/)

The gLTF Avatar Exporter is a tool for fixing mesh, skeleton and texture/material issues in avatars exported from 
various art tools.

It is provided as a web application that runs all processing directly in the browser, allowing you to:
* Drag and drop the input file (GLB / FBX) into the browser
* Preview the corrected avatar asset with an animation to confirm the skeleton is working as expected
* Download/export the file as a GLB from the browser

The web app is available at the following URL: \
[https://mml-io.github.io/avatar-tools/main/tools/gltf-avatar-exporter/](https://mml-io.github.io/avatar-tools/main/tools/gltf-avatar-exporter/)


# Avatar Exporter CLI

The gLTF Avatar Exporter is also available as a command line tool for batch processing of avatars. It is built as a 
single `.cjs` file that can be run with Node.js.

To use it, you must first build the packages in this repository using the following commands:

```bash
npm install
npm run build
```

This will build all of the packages in the repository, including the `gltf-avatar-exporter-cli` package. Once built, 
you can use the tool to process avatars using the following command from the root of this repository:

```bash
npm run convert -- -i <input file> -o <output file>
```
