/*
 * Optimize source files and write them into "./dist/"
 * Read more in https://github.com/jsenv/core
 */

import { build } from "@jsenv/core";
import { jsenvPluginPreact } from "@jsenv/plugin-preact";

await build({
  sourceDirectoryUrl: new URL("../src/", import.meta.url),
  buildDirectoryUrl: new URL("../dist/", import.meta.url),
  entryPoints: {
    "./index.html": "index.html",
  },
  bundling: {
    js_module: {
      chunks: {
        vendors: { "file:///**/node_modules/": true },
      },
    },
  },
  runtimeCompat: {
    chrome: "100",
  },
  minification: false,
  plugins: [jsenvPluginPreact()],
});
