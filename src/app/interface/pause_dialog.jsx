export const PauseDialog = ({ visible }) => {
  return (
    <div
      style={{
        position: "absolute",
        display: visible ? "block" : "none",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      }}
    ></div>
  );
};
