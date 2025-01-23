import { computed, signal } from "@preact/signals";
import {
  endDocumentNavigation,
  startDocumentNavigation,
} from "./document_navigating.js";
import { documentUrlSignal } from "./document_url.js";
import { normalizeUrl } from "./normalize_url.js";
import { goTo, installNavigation } from "./router.js";

const LOADING = { id: "loading" };
const ABORTED = { id: "aborted" };

const routeSet = new Set();
let fallbackRoute;
const createRoute = ({ urlTemplate, load = () => {} }) => {
  const documentRootUrl = new URL("/", window.location.origin);
  const routeUrlInstance = new URL(urlTemplate, documentRootUrl);

  let routePathname;
  let routeSearchParams;
  if (routeUrlInstance.pathname !== "/") {
    routePathname = routeUrlInstance.pathname;
  }
  if (routeUrlInstance.searchParams.toString() !== "") {
    routeSearchParams = routeUrlInstance.searchParams;
  }
  const test = ({ pathnane, searchParams }) => {
    if (urlTemplate) {
      if (routePathname && !pathnane.startsWith(routePathname)) {
        return false;
      }
      for (const [
        routeSearchParamKey,
        routeSearchParamValue,
      ] of routeSearchParams) {
        if (routeSearchParamValue === "") {
          if (!searchParams.has(routeSearchParamKey)) {
            return false;
          }
        }
        const value = searchParams.get(routeSearchParamKey);
        if (value !== routeSearchParamValue) {
          return false;
        }
      }
    }
    return true;
  };
  const addToUrl = (urlObject) => {
    if (routePathname) {
      urlObject.pathname = routePathname;
    }
    if (routeSearchParams) {
      for (const [key, value] of routeSearchParams) {
        urlObject.searchParams.set(key, value);
      }
    }
    return urlObject;
  };
  const removeFromUrl = (urlObject) => {
    if (routePathname) {
      urlObject.pathname = "/";
    }
    if (routeSearchParams) {
      for (const [key] of routeSearchParams) {
        urlObject.searchParams.delete(key);
      }
    }
    return urlObject;
  };

  const urlSignal = computed(() => {
    const documentUrl = documentUrlSignal.value;
    const documentUrlObject = new URL(documentUrl);
    const routeUrl = addToUrl(documentUrlObject);
    return normalizeUrl(routeUrl);
  });
  const readyStateSignal = signal("idle");
  const isActiveSignal = computed(() => {
    return readyStateSignal.value !== "idle";
  });

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
  const enter = () => {
    goTo(addToUrl(documentUrlSignal.value));
  };
  const leave = () => {
    goTo(removeFromUrl(documentUrlSignal.value));
  };

  return {
    urlSignal,
    test,
    load,
    enter,
    leave,

    onLeave,
    onEnter,
    onAbort,
    onLoadError,
    onLoadEnd,
    readyStateSignal,
    isActiveSignal,
  };
};
export const registerRoutes = ({ fallback, ...rest }) => {
  const routes = {};
  for (const key of Object.keys(rest)) {
    const route = createRoute(rest[key]);
    routeSet.add(route);
    routes[key] = route;
  }
  if (fallback) {
    fallbackRoute = createRoute(fallback);
  }
  installNavigation({ applyRouting });
  return routes;
};

const activeRouteSet = new Set();
export const applyRouting = async ({ url, state, signal }) => {
  startDocumentNavigation();
  const nextActiveRouteSet = new Set();
  for (const routeCandidate of routeSet) {
    const urlObject = new URL(url);
    const returnValue = routeCandidate.test({
      url,
      state,
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

export const useRouteUrl = (route) => {
  const routeUrl = route.urlSignal.value;
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
