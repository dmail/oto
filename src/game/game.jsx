import { useLayoutEffect } from "preact/hooks";
import gameStyleSheet from "./game.css" with { type: "css" };
import { PauseDialog } from "./pause_dialog.jsx";
import { Box } from "/components/box/box.jsx";
import { Fight } from "/fight/fight.jsx";
import { pause, pausedSignal, play } from "/signals.js";

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

  return (
    <div style="font-size: 16px;">
      <Box vertical name="screen" width="400" height="400">
        <Fight />
        <PauseDialog visible={pausedSignal.value} />
      </Box>
      <div>
        <button
          onClick={() => {
            if (pausedSignal.value) {
              play();
            } else {
              pause();
            }
          }}
        >
          {pausedSignal.value ? "play" : "pause"}
        </button>
      </div>
    </div>
  );
};
