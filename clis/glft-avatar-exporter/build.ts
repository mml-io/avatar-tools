import * as path from "path";

import * as esbuild from "esbuild";

import { rebuildOnDependencyChangesPlugin } from "../../build-utils/rebuildOnDependencyChangesPlugin";

const buildMode = "--build";
const watchMode = "--watch";

const helpString = `Mode must be provided as one of ${buildMode} or ${watchMode}`;

const args = process.argv.splice(2);

if (args.length !== 1) {
  console.error(helpString);
  process.exit(1);
}

const mode = args[0];

/*
 This plugin allows the .node files (e.g. from the "canvas" package) to be embedded in the build as base64 and required
 at runtime. This allows the built .cjs file to be portable to other directories as it contains all dependencies
 bundled.
*/
const nativeNodeModulesPlugin = {
  name: "native-node-modules",
  setup(build: esbuild.PluginBuild) {
    build.onResolve(
      { filter: /\.node$/, namespace: "file" },
      async (onResolveArgs: esbuild.OnResolveArgs) => {
        const absPath = path.resolve(onResolveArgs.resolveDir, onResolveArgs.path);
        const base64Contents = (await import("fs")).readFileSync(absPath).toString("base64");
        return {
          path: base64Contents,
          namespace: "node-file",
        };
      },
    );

    build.onLoad({ filter: /.*/, namespace: "node-file" }, (onLoadArgs: esbuild.OnLoadArgs) => {
      return {
        contents: `
        const fs = require("fs");
        const path = require("path");
        const tmpPath = fs.mkdtempSync("tmp-require");
        try {
          const filePath = path.join(path.resolve(tmpPath), "tmp.node");
          console.log("filePath", filePath);
          fs.writeFileSync(filePath, Buffer.from("${onLoadArgs.path}", "base64"));
          module.exports = require(filePath);
        } finally {
          // fs.rmSync(tmpPath, { recursive: true });
        }
      `,
      };
    });
  },
};

const buildOptions: esbuild.BuildOptions = {
  entryPoints: ["src/index.ts"],
  outfile: "./build/index.cjs", // Use cjs to ensure that the file is interpreted as CommonJS by node
  bundle: true,
  format: "cjs",
  sourcemap: "inline",
  platform: "node",
  target: "es2020",
  plugins:
    mode === watchMode
      ? [rebuildOnDependencyChangesPlugin, nativeNodeModulesPlugin]
      : [nativeNodeModulesPlugin],
};

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
