// https://github.com/WICG/navigation-api
// https://developer.mozilla.org/en-US/docs/Web/API/Navigation

import { computed, signal } from "@preact/signals";

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
  navigation.foward();
};

export const reload = () => {
  navigation.reload();
};

export const goTo = (url) => {
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

const documentIsLoadingSignal = signal(true);
if (document.readyState === "complete") {
  documentIsLoadingSignal.value = false;
  // isNavigatingSignal.value = false;
} else {
  document.addEventListener("readystatechange", () => {
    if (document.readyState === "complete") {
      documentIsLoadingSignal.value = false;
      // isNavigatingSignal.value = false
    }
  });
}
export const useDocumentIsLoading = () => {
  return documentIsLoadingSignal.value;
};

const canStopNavigationSignal = computed(() => {
  const documentIsLoading = documentIsLoadingSignal.value;
  if (documentIsLoading) {
    return true;
  }
  return false;
});
export const useCanStopNavigation = () => {
  return canStopNavigationSignal.value;
};

const currentNavigationSignal = computed(() => {
  const documentIsLoading = documentIsLoadingSignal.value();
  if (documentIsLoading) {
    return "loading";
  }
  return "complete";
});

let currentNavigateEvent;
export const stopNavigation = () => {
  const documentIsLoading = documentIsLoadingSignal.value;
  if (documentIsLoading) {
    window.stop();
    return;
  }
  if (currentNavigateEvent) {
    currentNavigateEvent.preventDefault();
  }
};

navigation.addEventListener("navigate", (event) => {
  if (!event.canIntercept) {
    return;
  }
  if (event.hashChange || event.downloadRequest !== null) {
    return;
  }
  currentNavigateEvent = event;
});
navigation.addEventListener("currententrychange", () => {
  canGoBackSignal.value = navigation.canGoBack;
  canGoForwardSignal.value = navigation.canGoForward;
});

navigation.addEventListener("navigatesuccess", () => {
  canGoBackSignal.value = navigation.canGoBack;
  canGoForwardSignal.value = navigation.canGoForward;
});
