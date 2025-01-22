import * as HistoryModule from "./history/history.js";
import * as NavModule from "./nav/nav.js";
import { applyRouting, injectRoute, registerFallbackRoute } from "./route.js";

const canUseNavigation = Boolean(window.navigation);
const installNavigation = canUseNavigation
  ? NavModule.installNavigation
  : HistoryModule.installNavigation;

export const registerRoutes = ({ fallback, ...rest }) => {
  const routes = {};
  for (const key of Object.keys(rest)) {
    const route = injectRoute(rest[key]);
    routes[key] = route;
  }
  if (fallback) {
    registerFallbackRoute(fallback);
  }
  installNavigation({ applyRouting });
  return routes;
};

export const goTo = canUseNavigation ? NavModule.goTo : HistoryModule.goTo;
export const stopLoad = canUseNavigation
  ? NavModule.stopLoad
  : HistoryModule.stopLoad;
export const reload = canUseNavigation
  ? NavModule.reload
  : HistoryModule.reload;
export const goBack = canUseNavigation
  ? NavModule.goBack
  : HistoryModule.goBack;
export const goForward = canUseNavigation
  ? NavModule.goForward
  : HistoryModule.goForward;
