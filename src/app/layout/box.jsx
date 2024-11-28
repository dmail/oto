export const Box = ({
  visible = true,
  className = "box",
  width = "100%",
  height = "100%",
  x = "start",
  y = "start",
  children,
  ...props
}) => {
  return (
    <div
      {...props}
      className={className}
      style={{
        position: "absolute",
        visibility: visible ? "visible" : "hidden",
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
        ...props.style,
      }}
    >
      {children}
    </div>
  );
};
