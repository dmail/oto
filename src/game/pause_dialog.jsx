import { pausedSignal, play } from "../signals.js";

export const PauseDialog = ({ visible }) => {
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
