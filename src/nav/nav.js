// https://github.com/WICG/navigation-api
// https://developer.mozilla.org/en-US/docs/Web/API/Navigation

import { signal } from "@preact/signals";

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

const documentReadySignal = signal(false);
const isNavigatingSignal = signal(true);

if (document.readyState === "complete") {
  documentReadySignal.value = true;
  // isNavigatingSignal.value = false;
} else {
  document.addEventListener("readystatechange", () => {
    if (document.readyState === "complete") {
      documentReadySignal.value = true;
      // isNavigatingSignal.value = false
    }
  });
}

let currentNavigateEvent;
export const stopNavigation = () => {
  const documentReady = documentReadySignal.peek();
  if (!documentReady) {
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
