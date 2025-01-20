/*
 * Start a development server for files inside source directory url
 * Read more in https://github.com/jsenv/core
 */

import { startDevServer } from "@jsenv/core";
import { jsenvPluginPreact } from "@jsenv/plugin-preact";
import open from "open";

const clientControlledResourceService = () => {
  let resolve;
  return {
    handleRequest: async (request) => {
      if (request.pathname === "/__delayed__.js") {
        if (request.method === "POST") {
          if (resolve) {
            resolve();
          }
          return {
            status: 200,
          };
        }
        if (resolve) {
          resolve();
        }
        const promise = new Promise((r) => {
          resolve = r;
        });
        await promise;
        return {
          status: 200,
          body: "",
          headers: {
            "content-length": 0,
          },
        };
      }
      return null;
    },
  };
};

export const devServer = await startDevServer({
  sourceDirectoryUrl: new URL("../src/", import.meta.url),
  plugins: [
    jsenvPluginPreact({
      refreshInstrumentation: { "file://**/*.jsx": true },
    }),
  ],
  port: 3400,
  services: [clientControlledResourceService()],
});
if (process.argv.includes("--open")) {
  open(`${devServer.origin}`);
}
