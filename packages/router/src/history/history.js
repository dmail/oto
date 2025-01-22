import { updateCanGoBack, updateCanGoForward } from "../can_go_back_forward.js";
import { documentIsLoadingSignal } from "../document_loading.js";
import { documentIsNavigatingSignal } from "../document_navigating.js";
import { documentUrlSignal, updateDocumentUrl } from "../document_url.js";

updateCanGoBack(true);
updateCanGoForward(true);
updateDocumentUrl(window.location.href);

export const installNavigation = ({ applyRouting }) => {
  // TODO
  // - listen a.href
  // - form submit
  // - hashchange
  // more??
  window.addEventListener("popstate", async () => {
    if (abortNavigation) {
      abortNavigation();
    }
    let abortController = new AbortController();
    abortNavigation = () => {
      abortController.abort();
    };
    const url = documentUrlSignal.peek();
    updateDocumentUrl(url);
    const routingPromise = applyRouting({
      url,
      signal: abortController.signal,
    });
    try {
      await routingPromise;
    } finally {
      abortController = null;
      abortNavigation = null;
    }
  });
  window.history.replaceState(null, null, window.location.href);
};
let abortNavigation;

export const goTo = async (url) => {
  const currentUrl = documentUrlSignal.peek();
  if (url === currentUrl) {
    return;
  }
  window.history.pushState(null, null, url);
};
export const stopLoad = () => {
  const documentIsLoading = documentIsLoadingSignal.value;
  if (documentIsLoading) {
    window.stop();
    return;
  }
  const documentIsNavigating = documentIsNavigatingSignal.value;
  if (documentIsNavigating) {
    abortNavigation();
    return;
  }
};
export const reload = () => {
  window.history.replaceState(null, null, documentUrlSignal.peek());
};
export const goBack = () => {
  window.history.back();
};
export const goForward = () => {
  window.history.forward();
};
