import { useState } from "preact/hooks";
import { pauseMusic, playMusic } from "./music/music.js";
import { Box } from "/components/box/box.jsx";

export const ButtonPlayPause = () => {
  const [paused, pausedSetter] = useState(false);
  if (paused) {
    return (
      <Box.button
        onClick={() => {
          playMusic();
          pausedSetter(false);
        }}
        width="32"
      >
        <PlayIconSvg />
      </Box.button>
    );
  }
  return (
    <Box.button
      onClick={() => {
        pauseMusic();
        pausedSetter(true);
      }}
      width="32"
    >
      <PauseIconSvg />
    </Box.button>
  );
};

const PlayIconSvg = () => {
  return (
    <svg name="play_icon" viewBox="0 0 24 24" fill="currentColor">
      <path
        d="M6 6 L16 12 L6 18 Z"
        stroke="#000000"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};

const PauseIconSvg = () => {
  return (
    <svg name="pause_icon" viewBox="0 0 24 24" fill="currentColor">
      <path
        d="M8 5 V19 M16 5 V19"
        stroke="#000000"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
};
