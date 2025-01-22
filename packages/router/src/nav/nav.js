/*
next step is to see if we can cancel a pending navigation

- https://github.com/WICG/navigation-api
- https://developer.mozilla.org/en-US/docs/Web/API/Navigation
- https://glitch.com/edit/#!/gigantic-honored-octagon?path=index.html%3A1%3A0
*/

import { updateCanGoBack, updateCanGoForward } from "../can_go_back_forward.js";
import { documentIsLoadingSignal } from "../document_loading.js";
import { documentIsNavigatingSignal } from "../document_navigating.js";
import { documentUrlSignal, updateDocumentUrl } from "../document_url.js";

updateDocumentUrl(navigation.currentEntry.url);
navigation.addEventListener("currententrychange", () => {
  updateDocumentUrl(navigation.currentEntry.url);
});

updateCanGoBack(navigation.canGoBack);
updateCanGoForward(navigation.canGoForward);
navigation.addEventListener("currententrychange", () => {
  updateCanGoBack(navigation.canGoBack);
  updateCanGoForward(navigation.canGoForward);
});
navigation.addEventListener("navigatesuccess", () => {
  updateCanGoBack(navigation.canGoBack);
  updateCanGoForward(navigation.canGoForward);
});

export const installNavigation = ({ applyRouting }) => {
  navigation.addEventListener("navigate", (event) => {
    if (!event.canIntercept) {
      return;
    }
    if (event.hashChange || event.downloadRequest !== null) {
      return;
    }
    if (
      !event.userInitiated &&
      event.navigationType === "reload" &&
      event.isTrusted
    ) {
      // let window.location.reload() reload the whole document
      // (used by jsenv hot reload)
      return;
    }
    event.intercept({
      handler: async () => {
        const url = event.destination.url;
        const { signal } = event;
        await applyRouting({ url, signal });
      },
    });
  });
  navigation.navigate(window.location.href, {
    history: "replace",
  });
};
export const goTo = (url) => {
  const currentUrl = documentUrlSignal.peek();
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
export const stopLoad = () => {
  const documentIsLoading = documentIsLoadingSignal.value;
  if (documentIsLoading) {
    window.stop();
    return;
  }
  const documentIsNavigating = documentIsNavigatingSignal.value;
  if (documentIsNavigating) {
    window.stop();
    return;
  }
};
export const reload = () => {
  navigation.reload();
};
export const goBack = () => {
  navigation.back();
};
export const goForward = () => {
  navigation.forward();
};
