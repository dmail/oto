export const Box = ({
  width = "100%",
  height = "100%",
  x = "center",
  y = "center",
  children,
}) => {
  return (
    <div
      className="box"
      style={{
        position: "absolute",
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        ...(x === "center"
          ? {
              left: "50%",
              marginLeft:
                typeof width === "number" ? `${-(width / 2)}px` : `-50%`,
            }
          : {
              left: typeof x === "number" ? `${x}px` : x,
            }),
        ...(y === "center"
          ? {
              top: "50%",
              marginTop:
                typeof height === "number" ? `${-(height / 2)}px` : "-50%",
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
