# Animation Cleaner CLI

A command-line tool for cleaning and optimizing animations in glTF/GLB files.

## Features

- Losslessly resamples animation frames
- Reduces redundant keyframes while preserving animation quality
- Welds vertices that are very close together
- Removes duplicate vertex or texture data
- Prunes unused data from the file
- Supports draco compression
- Can read meshopt-compressed files but doesn't apply meshopt compression

## Installation

```bash
# From the repository root
npm install
npm run build
```

## Usage

```bash
# From the repository root
npm run clean-animation -- -i input.glb -o output.glb [options]
```

Or install globally:

```bash
npm link
animation-cleaner -i input.glb -o output.glb [options]
```

### Options

- `-i, --input` - Input glTF/GLB file path (required)
- `-o, --output` - Output GLB file path (required)
- `-t, --tolerance` - Tolerance for animation keyframe simplification (default: 0.01)
- `-e, --maxError` - Maximum error allowed for animation optimization (default: 0.0001)

## Examples

Basic usage:
```bash
npm run clean-animation -- -i model.glb -o model_cleaned.glb
```

With custom tolerance:
```bash
npm run clean-animation -- -i model.glb -o model_cleaned.glb -t 0.05 -e 0.001
```

## How It Works

The Animation Cleaner uses gltf-transform to process 3D models and their animations:

1. **Keyframe Resampling**: Simplifies animation curves by removing redundant keyframes while maintaining the animation's shape.
2. **Custom Animation Optimization**: Further reduces keyframes by identifying and removing those that don't significantly change the animation.
3. **Vertex Welding**: Merges vertices that are very close to each other, reducing file size.
4. **Pruning and Deduplication**: Removes unused data and eliminates duplicated resources.

The tool is especially useful for animations exported from tools like Mixamo or Unreal Engine, which often contain unnecessarily high keyframe counts. 