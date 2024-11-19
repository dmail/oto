import { useLayoutEffect, useRef } from "preact/hooks";

const noop = () => {};

export const Animation = ({
  name,
  enabled = true,
  from,
  to,
  duration = 500,
  iterations = 1,
  fill = "forwards",
  onStart = noop,
  onCancel = noop,
  onFinish = noop,
  children,
}) => {
  const containerRef = useRef();
  const [fromTransform] = stepFromAnimationDescription(from);
  const [toTransform] = stepFromAnimationDescription(to);

  useLayoutEffect(() => {
    if (!enabled || !toTransform) {
      return () => {};
    }
    const steps = [];
    if (fromTransform) {
      steps.push({ transform: fromTransform });
    }
    steps.push({ transform: toTransform });
    const container = containerRef.current;
    const childNodes = container.childNodes;
    const cleanupCallbacks = [];
    for (const child of childNodes) {
      const animation = child.animate(steps, {
        duration,
        fill,
        iterations,
      });
      onStart();
      animation.oncancel = onCancel;
      animation.onfinish = onFinish;
      animation.finished.then(
        () => {
          animation.commitStyles();
        },
        () => {
          // ignore cancellation
        },
      );
      cleanupCallbacks.push(() => {
        if (animation.playState !== "finished") {
          animation.cancel();
        }
      });
    }
    return () => {
      for (const cleanupCallback of cleanupCallbacks) {
        cleanupCallback();
      }
    };
  }, [
    name,
    enabled,
    fromTransform,
    toTransform,
    duration,
    iterations,
    fill,
    onStart,
    onCancel,
    onFinish,
  ]);

  return (
    <div
      name={name}
      ref={containerRef}
      className="animation_container"
      style={{ width: "100%", height: "100%" }}
    >
      {children}
    </div>
  );
};

const stepFromAnimationDescription = (animationDescription) => {
  if (!animationDescription) {
    return [""];
  }
  const transforms = [];
  let x = animationDescription.x;
  let y = animationDescription.y;
  let angleX = animationDescription.angleX;
  let angleY = animationDescription.angleY;
  let scaleX = animationDescription.scaleX;
  if (animationDescription.mirrorX) {
    angleY = typeof angleY === "number" ? angleY + 180 : 180;
  }
  if (typeof x === "number") {
    transforms.push(`translateX(${x}px)`);
  }
  if (typeof y === "number") {
    transforms.push(`translateY(${y}px)`);
  }
  if (typeof angleX === "number") {
    transforms.push(`rotateX(${angleX}deg)`);
  }
  if (typeof angleY === "number") {
    transforms.push(`rotateY(${angleY}deg)`);
  }
  if (typeof scaleX === "number") {
    transforms.push(`scaleX(${scaleX})`);
  }
  return [transforms.join(" ")];
};
