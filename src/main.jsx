import { useFontFace } from "hooks/use_font_face.js";
import { render } from "preact";
import { useEffect, useErrorBoundary } from "preact/hooks";
import { goblinFontUrl } from "./components/text/font_urls.js";
import { Game } from "./game/game.jsx";

const GameWithErrorBoundary = () => {
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
  return <Game />;
};

render(<GameWithErrorBoundary />, document.querySelector("#root"));
