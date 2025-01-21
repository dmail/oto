/*
next step is to see if we can cancel a pending navigation

- https://github.com/WICG/navigation-api
- https://developer.mozilla.org/en-US/docs/Web/API/Navigation
- https://glitch.com/edit/#!/gigantic-honored-octagon?path=index.html%3A1%3A0
*/

import { computed, signal } from "@preact/signals";
import { useCallback } from "preact/hooks";

export const canGoBackSignal = signal(navigation.canGoBack);
export const useCanGoBack = () => {
  return canGoBackSignal.value;
};
export const goBack = () => {
  navigation.back();
};
export const canGoForwardSignal = signal(navigation.canGoForward);
export const useCanGoForward = () => {
  return canGoForwardSignal.value;
};
export const goForward = () => {
  navigation.forward();
};
navigation.addEventListener("currententrychange", () => {
  canGoBackSignal.value = navigation.canGoBack;
  canGoForwardSignal.value = navigation.canGoForward;
});
navigation.addEventListener("navigatesuccess", () => {
  canGoBackSignal.value = navigation.canGoBack;
  canGoForwardSignal.value = navigation.canGoForward;
});

export const reload = () => {
  navigation.reload();
};

const documentIsLoadingSignal = signal(true);
if (document.readyState === "complete") {
  documentIsLoadingSignal.value = false;
} else {
  document.addEventListener("readystatechange", () => {
    if (document.readyState === "complete") {
      documentIsLoadingSignal.value = false;
    }
  });
}
export const useDocumentIsLoading = () => {
  return documentIsLoadingSignal.value;
};

const LOADING = { id: "loading" };
const ABORTED = { id: "aborted" };

const currentNavigationSignal = signal(null);
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

const activeRouteSet = new Set();
navigation.addEventListener("navigate", (event) => {
  if (!event.canIntercept) {
    return;
  }
  if (event.hashChange || event.downloadRequest !== null) {
    return;
  }
  currentNavigationSignal.value = { event };
  const { signal } = event;

  const url = event.destination.url;
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
    currentNavigationSignal.value = null;
  });
  const handler = async () => {
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
      currentNavigationSignal.value = null;
    }
  };
  event.intercept({ handler });
});

export const registerRoutes = ({ fallback, ...rest }) => {
  const routes = {};
  for (const key of Object.keys(rest)) {
    const route = createRoute(rest[key]);
    routes[key] = route;
    routeSet.add(route);
  }
  if (fallback) {
    fallbackRoute = createRoute(fallback);
  }
  navigation.navigate(window.location.href, {
    history: "replace",
  });
  return routes;
};
export const injectRoute = (params) => {
  const route = createRoute(params);
  routeSet.add(route);
  return route;
};
export const useRoute = (route) => {
  const readyState = route.readyStateSignal.value;
  const isLoading = readyState === LOADING;
  const isAborted = readyState === ABORTED;
  const error = readyState.error;
  const data = readyState.data;

  return [isLoading, isAborted, error, data];
};
export const useRouteUrl = (route) => {
  const url = urlSignal.value;
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

const navigationReadyStateSignal = computed(() => {
  const documentIsLoading = documentIsLoadingSignal.value;
  if (documentIsLoading) {
    return "document_loading";
  }
  const currentNavigation = currentNavigationSignal.value;
  if (currentNavigation) {
    return "navigation_loading";
  }
  return "complete";
});
export const useNavigationReadyState = () => {
  return navigationReadyStateSignal.value;
};
export const useNavigationIsLoading = () => {
  return navigationReadyStateSignal.value !== "complete";
};
export const useCanStopNavigation = () => {
  return navigationReadyStateSignal.value !== "complete";
};
export const stopNavigation = () => {
  const documentIsLoading = documentIsLoadingSignal.value;
  if (documentIsLoading) {
    window.stop();
    return;
  }
  const currentNavigation = currentNavigationSignal.value;
  if (currentNavigation) {
    window.stop();
    return;
  }
};

const urlSignal = signal(navigation.currentEntry.url);
navigation.addEventListener("currententrychange", () => {
  //   console.log(
  //     "currententrychange",
  //     "from",
  //     e.from.url,
  //     "to",
  //     navigation.currentEntry.url,
  //   );
  urlSignal.value = navigation.currentEntry.url;
});
export const useUrl = () => {
  return urlSignal.value;
};
export const goTo = (url) => {
  const currentUrl = urlSignal.peek();
  if (url === currentUrl) {
    return;
  }
  const entries = navigation.entries();
  const prevEntry = entries[navigation.currentEntry.index - 1];
  if (prevEntry && prevEntry.url === url) {
    goBack();
    return;
  }
  const nextEntry = entries[navigation.currentEntry.index + 1];
  if (nextEntry && nextEntry.url === url) {
    goForward();
    return;
  }
  navigation.navigate(url);
};

const urlParamSignalMap = new Map();
// can be called multiple times by hooks
const signalForUrlParam = (name, getter) => {
  const existingSignal = urlParamSignalMap.get(name);
  if (existingSignal) {
    return existingSignal;
  }
  const signalForFirstCall = computed(() => {
    const url = urlSignal.value;
    return getter(url);
  });
  urlParamSignalMap.set(name, signalForFirstCall);
  return signalForFirstCall;
};

export const useUrlBooleanParam = (name) => {
  const urlBooleanParamSignal = signalForUrlBooleanParam(name);
  const urlBooleanParam = urlBooleanParamSignal.value;
  const enable = useCallback(() => {
    const urlWithBooleanParam = withUrlBooleanParam(urlSignal.peek(), name);
    goTo(urlWithBooleanParam);
  }, [name]);
  const disable = useCallback(() => {
    const urlWithoutBooleanParam = withoutUrlBooleanParam(
      urlSignal.peek(),
      name,
    );
    goTo(urlWithoutBooleanParam);
  }, [name]);
  return [urlBooleanParam, enable, disable];
};
const signalForUrlBooleanParam = (name) => {
  return signalForUrlParam(name, (url) => {
    return new URL(url).searchParams.has(name);
  });
};
const withUrlBooleanParam = (url, name) => {
  return updateUrl(url, () => {
    const urlObject = new URL(url);
    const { searchParams } = urlObject;
    if (searchParams.has(name)) {
      return null;
    }
    searchParams.set(name, "");
    return urlObject.toString();
  });
};
const withoutUrlBooleanParam = (url, name) => {
  return updateUrl(url, () => {
    const urlObject = new URL(url);
    const { searchParams } = urlObject;
    if (!searchParams.has(name)) {
      return null;
    }
    searchParams.delete(name);
    return urlObject.toString();
  });
};

export const useUrlStringParam = (
  name,
  // TODO: add a param to enum the allowed values
) => {
  const urlStringParamSignal = signalForUrlStringParam(name);
  const urlStringParam = urlStringParamSignal.value;
  const set = useCallback(
    (value) => {
      if (value) {
        const urlWithStringParam = withUrlStringParam(
          urlSignal.peek(),
          name,
          value,
        );
        goTo(urlWithStringParam);
        return;
      }
      const urlWithoutStringParam = withoutUrlStringParam(
        urlSignal.peek(),
        name,
      );
      goTo(urlWithoutStringParam);
    },
    [name],
  );
  return [urlStringParam, set];
};
const signalForUrlStringParam = (name) => {
  return signalForUrlParam(name, (url) => {
    return new URL(url).searchParams.get(name);
  });
};
export const withUrlStringParam = (url, name, value) => {
  return updateUrl(url, () => {
    const urlObject = new URL(url);
    const { searchParams } = urlObject;
    searchParams.set(name, value);
    return urlObject.toString();
  });
};
const withoutUrlStringParam = (url, name) => {
  return updateUrl(url, () => {
    const urlObject = new URL(url);
    const { searchParams } = urlObject;
    if (!searchParams.has(name)) {
      return null;
    }
    searchParams.delete(name);
    return urlObject.toString();
  });
};

const updateUrl = (url, urlTransformer) => {
  const newUrl = urlTransformer();
  if (!newUrl) {
    return url;
  }
  const newUrlString = String(newUrl);
  const newUrlNormalized = normalizeUrl(newUrlString);
  return newUrlNormalized;
};
const normalizeUrl = (url) => {
  if (url.includes("?")) {
    // disable on data urls (would mess up base64 encoding)
    if (url.startsWith("data:")) {
      return url;
    }
    return url.replace(/[=](?=&|$)/g, "");
  }
  return url;
};
