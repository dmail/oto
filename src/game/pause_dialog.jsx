import { useSignalEffect } from "@preact/signals";
import { pausedSignal, play } from "../signals.js";
import { useBackgroundMusic } from "/audio/use_sound.js";

const pauseMusicUrl = import.meta.resolve("./pause.mp3");

export const PauseDialog = ({ visible }) => {
  const [playMusic, pauseMusic] = useBackgroundMusic(
    { url: pauseMusicUrl, volume: 0.2, restartOnPlay: true },
    { canPlayWhilePaused: true },
  );

  useSignalEffect(() => {
    const paused = pausedSignal.value;
    if (paused) {
      playMusic();
    } else {
      pauseMusic();
    }
  });

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
