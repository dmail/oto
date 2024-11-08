import { useLayoutEffect } from "preact/hooks";
import appStyleSheet from "./app.css" with { type: "css" };

import { MountainAndSkyBattleBackground } from "./battle_background_spritesheet.jsx";

export const App = () => {
  useLayoutEffect(() => {
    document.adoptedStyleSheets = [
      ...document.adoptedStyleSheets,
      appStyleSheet,
    ];
    return () => {
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
        (s) => s !== appStyleSheet,
      );
    };
  }, []);

  return (
    <div className="app">
      <MountainAndSkyBattleBackground />
    </div>
  );
};
