import { render } from "preact";
import { useEffect, useErrorBoundary } from "preact/hooks";
import { App } from "./app/app.jsx";
import { goblinFontUrl } from "./app/components/text/font_urls.js";
import { useFontFace } from "./app/hooks/use_font_face.js";

const AppWithErrorBoundary = () => {
  const [error, resetError] = useErrorBoundary();
  const goblinFont = useFontFace("goblin", {
    url: goblinFontUrl,
  });
  useEffect(() => {
    if (!import.meta.hot) {
      return null;
    }
    return import.meta.hot.events.beforePartialReload.addCallback(() => {
      resetError();
    });
  }, []);
  if (error) {
    return `An error occurred: ${error.message}`;
  }
  if (!goblinFont) {
    return "loading font";
  }
  return <App />;
};

render(<AppWithErrorBoundary />, document.querySelector("#root"));
