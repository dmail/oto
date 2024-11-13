import { useRef, useLayoutEffect } from "preact/hooks";

export const Box = ({ width, height, x = 0, y = 0, children, animate }) => {
  const nodeRef = useRef();
  useLayoutEffect(() => {
    if (!animate) {
      return () => {};
    }
    const node = nodeRef.current;
    const {
      steps,
      duration = 500,
      iterations = 1,
      fill = "forwards",
      onCancel = () => {},
      onFinish = () => {},
    } = animate;
    const animation = node.animate(steps, { duration, fill, iterations });
    animation.oncancel = onCancel;
    animation.onfinish = onFinish;
    animation.finished.then(() => {
      animation.commitStyles();
      animation.cancel();
    });
    return () => {
      animation.cancel();
    };
  }, [animate]);

  return (
    <div
      ref={nodeRef}
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
