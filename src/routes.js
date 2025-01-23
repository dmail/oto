import { registerRoutes } from "router";

const { paused } = registerRoutes({
  paused: {
    buildUrl: (urlObject) => {
      urlObject.searchParams.set("paused", "");
      return urlObject;
    },
    test: ({ searchParams }) => {
      return searchParams.has("paused");
    },
  },
});

export const pausedRoute = paused;
