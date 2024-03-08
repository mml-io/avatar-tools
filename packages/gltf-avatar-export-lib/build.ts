import * as esbuild from "esbuild";

import { dtsPlugin } from "../../build-utils/dtsPlugin";

const buildMode = "--build";
const watchMode = "--watch";

const helpString = `Mode must be provided as one of ${buildMode} or ${watchMode}`;

const buildOptions: esbuild.BuildOptions = {
  entryPoints: {
    index: "src/index.ts",
  },
  write: true,
  bundle: true,
  format: "esm",
  outdir: "build",
  platform: "node",
  metafile: true,
  packages: "external",
  sourcemap: true,
  target: "node14",
  plugins: [dtsPlugin()],
};

const args = process.argv.splice(2);

if (args.length !== 1) {
  console.error(helpString);
  process.exit(1);
}

const mode = args[0];

switch (mode) {
  case buildMode:
    esbuild.build(buildOptions).catch(() => process.exit(1));
    break;
  case watchMode:
    esbuild
      .context({ ...buildOptions })
      .then((context) => context.watch())
      .catch(() => process.exit(1));
    break;
  default:
    console.error(helpString);
}
