/*
next step is to see if we can cancel a pending navigation

- https://github.com/WICG/navigation-api
- https://developer.mozilla.org/en-US/docs/Web/API/Navigation
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

const currentNavigationSignal = signal(null);
export const setRouteHandlers = (routeHandlers) => {
  navigation.addEventListener("navigate", (event) => {
    if (!event.canIntercept) {
      return;
    }
    if (event.hashChange || event.downloadRequest !== null) {
      return;
    }
    const url = event.destination.url;
    for (const routeHandlerCandidate of routeHandlers) {
      const urlObject = new URL(url);
      const returnValue = routeHandlerCandidate({
        url,
        searchParams: urlObject.searchParams,
        pathname: urlObject.pathname,
        hash: urlObject.hash,
      });
      if (returnValue) {
        event.intercept({ handler: returnValue });
        currentNavigationSignal.value = {
          event,
        };
        return;
      }
    }
  });
  navigation.navigate(window.location.href, { history: "replace" });
};
navigation.addEventListener("navigateerror", () => {
  currentNavigationSignal.value = null;
});
navigation.addEventListener("navigatesuccess", () => {
  currentNavigationSignal.value = null;
});
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
    currentNavigation.event.preventDefault();
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
    const urlWithBooleanParam = withUrlBooleanParam(name);
    goTo(urlWithBooleanParam);
  }, [name]);
  const disable = useCallback(() => {
    const urlWithoutBooleanParam = withoutUrlBooleanParam(name);
    goTo(urlWithoutBooleanParam);
  }, [name]);
  return [urlBooleanParam, enable, disable];
};
const signalForUrlBooleanParam = (name) => {
  return signalForUrlParam(name, (url) => {
    return new URL(url).searchParams.has(name);
  });
};
const withUrlBooleanParam = (name) => {
  return updateUrl((url) => {
    const urlObject = new URL(url);
    const { searchParams } = urlObject;
    if (searchParams.has(name)) {
      return null;
    }
    searchParams.set(name, "");
    return urlObject.toString();
  });
};
const withoutUrlBooleanParam = (name) => {
  return updateUrl((url) => {
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
        const urlWithStringParam = withUrlStringParam(name, value);
        goTo(urlWithStringParam);
        return;
      }
      const urlWithoutStringParam = withoutUrlStringParam(name);
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
const withUrlStringParam = (name, value) => {
  return updateUrl((url) => {
    const urlObject = new URL(url);
    const { searchParams } = urlObject;
    searchParams.set(name, value);
    return urlObject.toString();
  });
};
const withoutUrlStringParam = (name) => {
  return updateUrl((url) => {
    const urlObject = new URL(url);
    const { searchParams } = urlObject;
    if (!searchParams.has(name)) {
      return null;
    }
    searchParams.delete(name);
    return urlObject.toString();
  });
};

const updateUrl = (urlTransformer) => {
  const url = window.location.href;
  const newUrl = urlTransformer(url);
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
