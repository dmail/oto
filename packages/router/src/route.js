import { signal } from "@preact/signals";
import {
  endDocumentNavigation,
  startDocumentNavigation,
} from "./document_navigating.js";
import { documentUrlSignal } from "./document_url.js";

const LOADING = { id: "loading" };
const ABORTED = { id: "aborted" };

const routeSet = new Set();
let fallbackRoute;
const createRoute = ({ test, buildUrl, load = () => {} }) => {
  const readyStateSignal = signal("idle");

  const onLeave = () => {
    readyStateSignal.value = "idle";
  };
  const onEnter = () => {
    readyStateSignal.value = LOADING;
  };
  const onAbort = () => {
    readyStateSignal.value = ABORTED;
  };
  const onLoadError = (error) => {
    readyStateSignal.value = {
      error,
    };
  };
  const onLoadEnd = (data) => {
    readyStateSignal.value = {
      data,
    };
  };

  return {
    buildUrl,
    test,
    load,

    onLeave,
    onEnter,
    onAbort,
    onLoadError,
    onLoadEnd,
    readyStateSignal,
  };
};

export const registerFallbackRoute = (params) => {
  fallbackRoute = createRoute(params);
};

const activeRouteSet = new Set();
export const applyRouting = ({ url, signal }) => {
  startDocumentNavigation();
  const nextActiveRouteSet = new Set();
  for (const routeCandidate of routeSet) {
    const urlObject = new URL(url);
    const returnValue = routeCandidate.test({
      url,
      searchParams: urlObject.searchParams,
      pathname: urlObject.pathname,
      hash: urlObject.hash,
    });
    if (returnValue) {
      nextActiveRouteSet.add(routeCandidate);
    }
  }
  if (nextActiveRouteSet.size === 0) {
    nextActiveRouteSet.add(fallbackRoute);
  }
  const routeToLeaveSet = new Set();
  const routeToEnterSet = new Set();
  for (const activeRoute of activeRouteSet) {
    if (!nextActiveRouteSet.has(activeRoute)) {
      routeToLeaveSet.add(activeRoute);
    }
  }
  for (const nextActiveRoute of nextActiveRouteSet) {
    if (!activeRouteSet.has(nextActiveRoute)) {
      routeToEnterSet.add(nextActiveRoute);
    }
  }
  nextActiveRouteSet.clear();
  for (const routeToLeave of routeToLeaveSet) {
    activeRouteSet.delete(routeToLeave);
    routeToLeave.onLeave();
  }

  signal.addEventListener("abort", () => {
    for (const activeRoute of activeRouteSet) {
      activeRoute.onAbort();
    }
    endDocumentNavigation();
  });
  return async () => {
    try {
      const promises = [];
      for (const routeToEnter of routeToEnterSet) {
        activeRouteSet.add(routeToEnter);
        routeToEnter.onEnter();
        const loadPromise = routeToEnter.load({ signal });
        loadPromise.then(
          () => {
            routeToEnter.onLoadEnd();
          },
          (e) => {
            routeToEnter.onLoadError(e);
            throw e;
          },
        );
        promises.push(loadPromise);
      }
      await Promise.all(promises);
    } finally {
      endDocumentNavigation();
    }
  };
};

export const injectRoute = (params) => {
  const route = createRoute(params);
  routeSet.add(route);
  return route;
};

export const useRouteUrl = (route) => {
  const url = documentUrlSignal.value;
  const routeUrl = route.buildUrl(url);
  return routeUrl;
};
export const useRouteIsActive = (route) => {
  return route.readyStateSignal.value !== "idle";
};
export const useRouteIsLoading = (route) => {
  return route.readyStateSignal.value === LOADING;
};
export const useRouteLoadIsAborted = (route) => {
  return route.readyStateSignal.value === ABORTED;
};
export const useRouteLoadError = (route) => {
  return route.readyStateSignal.value.error;
};
export const useRouteLoadData = (route) => {
  return route.readyStateSignal.value.data;
};
