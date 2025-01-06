import { useLayoutEffect } from "preact/hooks";
import gameStyleSheet from "./game.css" with { type: "css" };
import { Box } from "/components/box/box.jsx";
import { Fight } from "/fight/fight.jsx";
import { pause, play, useGamePaused } from "/game_pause/game_pause.js";
import { PauseDialog } from "/game_pause/pause_dialog.jsx";

export const Game = () => {
  useLayoutEffect(() => {
    document.adoptedStyleSheets = [
      ...document.adoptedStyleSheets,
      gameStyleSheet,
    ];
    return () => {
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
        (s) => s !== gameStyleSheet,
      );
    };
  }, []);

  const gamePaused = useGamePaused();

  return (
    <div style="font-size: 16px;">
      <Box vertical name="screen" width="400" height="400">
        <Fight />
        <PauseDialog visible={gamePaused} />
      </Box>
      <div>
        <button
          onClick={() => {
            if (gamePaused) {
              play();
            } else {
              pause();
            }
          }}
        >
          {gamePaused ? "play" : "pause"}
        </button>
      </div>
    </div>
  );
};
