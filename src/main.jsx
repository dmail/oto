import { render } from "preact";
import { useErrorBoundary } from "preact/hooks";
import { App } from "./app/app.jsx";
import { goblinFontUrl, useFontFace } from "./app/text/use_font_face.js";

const AppWithErrorBoundary = () => {
  const [error] = useErrorBoundary();
  const goblinFont = useFontFace("goblin", {
    url: goblinFontUrl,
  });
  if (error) {
    return `An error occurred: ${error.message}`;
  }
  if (!goblinFont) {
    return "loading font";
  }
  return <App />;
};

render(<AppWithErrorBoundary />, document.querySelector("#root"));
