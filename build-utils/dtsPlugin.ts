// Originally from Floffah https://github.com/Floffah/esbuild-plugin-d.ts/blob/master/LICENSE

import { mkdirSync, existsSync, lstatSync, readFileSync, writeFileSync } from "fs";
import * as crypto from "node:crypto";
import { basename, dirname, resolve } from "path";

import { LogLevel, Plugin } from "esbuild";
import jju from "jju";
import ts from "typescript";

function pathToCacheName(path: string) {
  return path.replace(/[^a-z0-9\-_.]/gi, "_");
}

function getCacheFilePath(path: string) {
  // Create a cache directory in the node_modules directory
  const cacheDir = resolve(process.cwd(), "node_modules", ".cache", "esbuild-dts");
  if (!existsSync(cacheDir)) {
    // Create the directory (potentially recursively)
    mkdirSync(cacheDir, { recursive: true });
  }

  return resolve(cacheDir, pathToCacheName(path));
}

function getCacheFileContents(cacheFilePath: string): string | undefined {
  if (!existsSync(cacheFilePath)) {
    return undefined;
  }

  return readFileSync(cacheFilePath, "utf-8");
}

function setCacheFileContents(cacheFilePath: string, cacheContents: string) {
  return writeFileSync(cacheFilePath, cacheContents, "utf-8");
}

function allFilesToCacheHash(fileContents: Map<string, string>): string {
  // Sort the files by name so that the hash is consistent
  const files = Array.from(fileContents.keys()).sort();
  // Hash the files individually and then hash the hashes
  const hashes = [];
  for (const file of files) {
    const hash = crypto
      .createHash("sha256")
      .update(fileContents.get(file) ?? "")
      .digest("hex");
    hashes.push(hash);
  }
  return crypto.createHash("sha256").update(hashes.join("")).digest("hex");
}

function getTSConfig(
  forcepath?: string,
  conf?: string,
  wd = process.cwd(),
): { loc: string; conf: any } {
  let f = forcepath ?? ts.findConfigFile(wd, ts.sys.fileExists, conf);
  if (!f) throw new Error("No config file found");
  if (f.startsWith(".")) f = new URL(f, import.meta.url).pathname;
  const c = ts.readConfigFile(f, (path) => readFileSync(path, "utf-8"));
  if (c.error) {
    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw c.error;
  } else {
    return { loc: f, conf: c.config };
  }
}

interface DTSPluginOpts {
  /**
   * override the directory to output to.
   * @default undefined
   */
  outDir?: string;
  /**
   * path to the tsconfig to use. (some monorepos might need to use this)
   */
  tsconfig?: string;
}

function getLogLevel(level?: LogLevel): LogLevel[] {
  if (!level || level === "silent") return ["silent"];

  const levels: LogLevel[] = ["verbose", "debug", "info", "warning", "error", "silent"];

  for (const l of levels) {
    if (l === level) {
      break;
    } else {
      levels.splice(levels.indexOf(l), 1);
    }
  }

  return levels;
}

function humanFileSize(size: number): string {
  const i = Math.floor(Math.log(size) / Math.log(1024));
  return Math.round((size / Math.pow(1024, i)) * 100) / 100 + ["b", "kb", "mb", "gb", "tb"][i];
}

export const dtsPlugin = (opts: DTSPluginOpts = {}) =>
  ({
    name: "dts-plugin",
    setup(build) {
      const absoluteDir = resolve(
        process.cwd(),
        opts.outDir ?? build.initialOptions.outdir ?? "dist",
      );

      const allFiles = new Map<string, string>();
      // context
      const l = getLogLevel(build.initialOptions.logLevel);
      const conf = getTSConfig(opts.tsconfig);
      const finalconf = conf.conf;

      // get extended config
      if (Object.prototype.hasOwnProperty.call(conf.conf, "extends")) {
        const extendedfile = readFileSync(resolve(dirname(conf.loc), conf.conf.extends), "utf-8");
        const extended = jju.parse(extendedfile);
        if (
          Object.prototype.hasOwnProperty.call(extended, "compilerOptions") &&
          Object.prototype.hasOwnProperty.call(finalconf, "compilerOptions")
        ) {
          finalconf.compilerOptions = {
            ...extended.compilerOptions,
            ...finalconf.compilerOptions,
          };
        }
      }

      // get and alter compiler options
      const copts = ts.convertCompilerOptionsFromJson(
        finalconf.compilerOptions,
        process.cwd(),
      ).options;
      copts.declaration = true;
      copts.emitDeclarationOnly = true;
      copts.listEmittedFiles = true;
      if (!copts.declarationDir) {
        copts.declarationDir = opts.outDir ?? build.initialOptions.outdir ?? copts.outDir;
      }

      // ts compiler stuff
      const host = copts.incremental
        ? ts.createIncrementalCompilerHost(copts)
        : ts.createCompilerHost(copts);

      build.onStart(() => {
        allFiles.clear();
      });

      // get all ts files
      build.onLoad({ filter: /(\.tsx|\.ts)$/ }, (args) => {
        const sourceFile = host.getSourceFile(
          args.path,
          copts.target ?? ts.ScriptTarget.Latest,
          (m) => console.log(m),
          true,
        );
        if (sourceFile) {
          const sourceText = sourceFile.text;
          allFiles.set(args.path, sourceText);
        }
        return {};
      });

      // finish compilation
      build.onEnd(() => {
        const files = Array.from(allFiles.keys());
        const start = Date.now();

        let final = "";
        const allFilesHash = allFilesToCacheHash(allFiles);
        const cacheFilePath = getCacheFilePath(absoluteDir);
        const cacheContents = getCacheFileContents(cacheFilePath);
        const indexDTSPath = resolve(absoluteDir, "index.d.ts");
        let cacheHit = false;
        if (cacheContents && cacheContents === allFilesHash) {
          // Check if the output index.d.ts exists (it might have been manually deleted)
          if (!existsSync(indexDTSPath)) {
            // If it doesn't exist, we need to rebuild
            final += `dts plugin cache hit - index.d.ts missing - rebuilding\n`;
          } else {
            // If it does exist, we can just skip the build as there's a cache hit
            cacheHit = true;
            final += `dts plugin cache hit - not building\n`;
          }
        }

        if (!cacheHit) {
          const finalprogram = copts.incremental
            ? ts.createIncrementalProgram({
                options: copts,
                host,
                rootNames: files,
              })
            : ts.createProgram(files, copts, host);

          const emit = finalprogram.emit();

          if (emit.emitSkipped || typeof emit.emittedFiles === "undefined") {
            if (l.includes("warning")) console.warn(`Typescript did not emit anything`);
          } else {
            for (const emitted of emit.emittedFiles) {
              if (existsSync(emitted) && !emitted.endsWith(".tsbuildinfo")) {
                const stat = lstatSync(emitted);
                final += `  ${resolve(emitted)
                  .replace(resolve(process.cwd()), "")
                  .replace(/^[\\/]/, "")
                  .replace(
                    basename(emitted),
                    `${basename(emitted)}`,
                  )} ${humanFileSize(stat.size)}\n`;
              }
            }
          }
          final += `Writing cache file to ${cacheFilePath}\n`;
          setCacheFileContents(cacheFilePath, allFilesHash);
        }

        if (l.includes("info")) {
          console.log(final + `\nFinished compiling declarations in ${Date.now() - start}ms`);
        }
      });
    },
  }) as Plugin;
