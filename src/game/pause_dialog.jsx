import { pausedSignal, play } from "../signals.js";
import { createBackgroundMusic, useAudio } from "/audio/use_sound.js";

const pauseMusicUrl = import.meta.resolve("./pause.mp3");
const pauseMusic = createBackgroundMusic(
  {
    url: pauseMusicUrl,
    volume: 0.2,
    restartOnPlay: true,
  },
  {
    playWhilePaused: true,
  },
);

export const PauseDialog = ({ visible }) => {
  useAudio(pauseMusic);

  return (
    <div
      name="pause_dialog"
      style={{
        position: "absolute",
        display: visible ? "flex" : "none",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        justifyContent: "center",
        alignItems: "center",
      }}
      onClick={() => {
        play();
      }}
    >
      <button disabled={!pausedSignal.value}>Play</button>
    </div>
  );
};
