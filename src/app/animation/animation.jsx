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
      onStart = () => {},
      onCancel = () => {},
      onFinish = () => {},
    } = options;
    for (const child of childNodes) {
      const animation = child.animate(steps, { duration, fill, iterations });
      onStart();
      animation.oncancel = onCancel;
      animation.onfinish = onFinish;
      animation.finished.then(
        () => {
          animation.commitStyles();
          animation.cancel();
        },
        () => {
          // ignore cancellation
        },
      );
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
    <div ref={containerRef} className="animation_container">
      {children}
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
