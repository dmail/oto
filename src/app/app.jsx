import { useLayoutEffect } from "preact/hooks";
import appStyleSheet from "./app.css" with { type: "css" };
import "./custom_elements_redefine.js";

import { MountainAndSkyBattleBackground } from "./battle_background/battle_backgrounds.jsx";
import { FirstEnemy } from "./enemy/enemies.jsx";
import { Benjamin } from "./character/benjamin.jsx";
import { Box } from "./layout/layout.jsx";

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
    <div
      className="app"
      style={{ position: "relative", height: "200px", width: "300px" }}
    >
      <div
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      >
        <MountainAndSkyBattleBackground />
      </div>
      <div
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      >
        <Box height={100} width={100} x="center" y={26}>
          <FirstEnemy />
        </Box>
        <Box width={25} height={25} x="center" y={140}>
          <Benjamin direction="top" activity="walking" />
        </Box>
      </div>
    </div>
  );
};
