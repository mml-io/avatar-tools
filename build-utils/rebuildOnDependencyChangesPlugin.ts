import { createRequire } from "node:module";

import { PluginBuild } from "esbuild";

export const rebuildOnDependencyChangesPlugin = {
  name: "watch-dependencies",
  setup(build: PluginBuild) {
    build.onResolve({ filter: /.*/ }, (args) => {
      // Include dependent packages in the watch list
      if (args.kind === "import-statement") {
        if (!args.path.startsWith(".")) {
          const require = createRequire(args.resolveDir);
          const resolved = require.resolve(args.path);
          return {
            watchFiles: [resolved],
          };
        }
      }
    });
  },
};
