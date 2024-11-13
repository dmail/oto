export const Box = ({ width, height, x = 0, y = 0, children }) => {
  return (
    <div
      style={{
        position: "absolute",
        width: `${width}px`,
        height: `${height}px`,
        ...(x === "center"
          ? {
              left: "50%",
              marginLeft: `${-(width / 2)}px`,
            }
          : {
              left: typeof x === "number" ? `${x}px` : x,
            }),
        ...(y === "center"
          ? {
              top: "50%",
              marginTop: `${-(height / 2)}px`,
            }
          : {
              top: typeof x === "number" ? `${y}px` : y,
            }),
      }}
    >
      {children}
    </div>
  );
};
