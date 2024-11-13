// import { toChildArray } from "preact";
import { useRef, useLayoutEffect } from "preact/hooks";

export const Animation = ({ options, children }) => {
  const containerRef = useRef();

  useLayoutEffect(() => {
    if (!options) {
      return () => {};
    }
    const container = containerRef.current;
    const childNodes = container.childNodes;
    const cleanupCallbacks = [];
    const {
      steps,
      duration = 500,
      iterations = 1,
      fill = "forwards",
      onCancel = () => {},
      onFinish = () => {},
    } = options;
    for (const child of childNodes) {
      const animation = child.animate(steps, { duration, fill, iterations });
      animation.oncancel = onCancel;
      animation.onfinish = onFinish;
      animation.finished.then(() => {
        animation.commitStyles();
        animation.cancel();
      });
      cleanupCallbacks.push(() => {
        animation.cancel();
      });
    }
    return () => {
      for (const cleanupCallback of cleanupCallbacks) {
        cleanupCallback();
      }
    };
  }, [options]);

  return (
    <div ref={containerRef}>
      {children}
      {/* {toChildArray(children).map((child) => {
        return child;
      })} */}
    </div>
  );
};

export const translateY = (to) => {
  return {
    steps: [
      {
        transform: `translateY(${to}px)`,
      },
    ],
  };
};
