import fs from "fs";
import path from "path";

import CleanCSS from "clean-css";
import * as esbuild from "esbuild";
import { copy } from "esbuild-plugin-copy";

const buildMode = "--build";
const watchMode = "--watch";

const helpString = `Mode must be provided as one of ${buildMode} or ${watchMode}`;

const args = process.argv.splice(2);

if (args.length !== 1) {
  console.error(helpString);
  process.exit(1);
}

const mode = args[0];

const commonOptions: esbuild.BuildOptions = {
  entryPoints: {
    index: "src/index.ts",
  },
  bundle: true,
  write: true,
  outdir: "./build/",
  assetNames: "[dir]/[name]-[hash]",
  preserveSymlinks: true,
  loader: {
    ".svg": "base64",
    ".png": "base64",
    ".jpg": "base64",
    ".glb": "base64",
    ".hdr": "base64",
  },
  outbase: "../",
  sourceRoot: "./src",
  publicPath: "/client/",
  plugins: [
    copy({
      resolveFrom: "cwd",
      assets: {
        from: ["./public/**/*"],
        to: ["./build/"],
      },
    }),
  ],
};

const htmlPackingPlugin: esbuild.Plugin = {
  name: "example",
  setup(build) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    build.onEnd((_result) => {
      const htmlFilePath = path.join("./public", "index.html");
      const cssFilePath = path.join("./public", "style.css");
      const faviconFilePath = path.join("./public", "favicon.png");

      let htmlContent = fs.readFileSync(htmlFilePath, "utf8");

      if (fs.existsSync(cssFilePath)) {
        const cssContent = fs.readFileSync(cssFilePath, "utf8");
        const minifiedCss = new CleanCSS({}).minify(cssContent).styles;
        const styleTag = `<style>${minifiedCss}</style>`;
        const headCloseTag = "</head>";
        const headCloseIndex = htmlContent.indexOf(headCloseTag);
        if (headCloseIndex !== -1) {
          htmlContent =
            htmlContent.slice(0, headCloseIndex) + styleTag + htmlContent.slice(headCloseIndex);
        } else {
          htmlContent = styleTag + htmlContent;
        }
      }

      if (fs.existsSync(faviconFilePath)) {
        const faviconBuffer = fs.readFileSync(faviconFilePath);
        const base64Favicon = faviconBuffer.toString("base64");
        const faviconDataUrl = `data:image/png;base64,${base64Favicon}`;
        htmlContent = htmlContent.replace(
          /href="\/client\/favicon\.png"/,
          `href="${faviconDataUrl}"`,
        );
      }

      const scriptAsText = fs.readFileSync("./build/index.js", "utf8");
      const replacementLine = `<script src="TO_REPLACE_AT_BUILD" type="module"></script>`;
      const index = htmlContent.indexOf(replacementLine);
      if (index === -1) {
        throw new Error("Failed to find replacement line");
      }
      htmlContent =
        htmlContent.substring(0, index) +
        `<script>${scriptAsText}</script>` +
        htmlContent.substring(index + replacementLine.length);

      // Write the modified HTML file
      fs.mkdirSync("./build", { recursive: true });
      fs.writeFileSync("./build/index.html", htmlContent);

      // Delete the original built/copied script and css files
      fs.unlinkSync("./build/index.js");
      console.log("./build/index.js was deleted.");
      fs.unlinkSync("./build/style.css");
      console.log("./build/style.css was deleted.");
      fs.unlinkSync("./build/favicon.svg");
      console.log("./build/favicon.svg was deleted.");
      fs.unlinkSync("./build/favicon.png");
      console.log("./build/favicon.svg was deleted.");
    });
  },
};

switch (mode) {
  case buildMode:
    esbuild
      .build({
        ...commonOptions,
        minify: true,
        plugins: [...(commonOptions.plugins ?? []), htmlPackingPlugin],
      })
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });
    break;
  case watchMode:
    esbuild
      .context({
        ...commonOptions,
        minify: false,
        sourcemap: "inline",
        plugins: [...(commonOptions.plugins ?? []), htmlPackingPlugin],
        //         banner: {
        //           js: `
        // (() =>
        //   new WebSocket(
        //     (window.location.protocol === "https:" ? "wss://" : "ws://") +
        //     window.location.host +
        //     "/client-build"
        //   ).addEventListener("message", () => location.reload())
        // )();
        // `,
        //         },
      })
      .then((context) => context.watch())
      .catch(() => process.exit(1));
    break;
  default:
    console.error(helpString);
}
