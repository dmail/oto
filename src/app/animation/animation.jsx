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
  for (const animatedProp of Object.keys(animationDescription)) {
    const animatedValue = animationDescription[animatedProp];
    if (animatedProp === "x") {
      transforms.push(`translateX(${animatedValue}px)`);
      continue;
    }
    if (animatedProp === "y") {
      transforms.push(`translateY(${animatedValue}px)`);
      continue;
    }
    if (animatedProp === "scaleX") {
      transforms.push(`scaleX(${animatedValue})`);
      continue;
    }
    if (animatedProp === "angle") {
      transforms.push(`rotate(${animatedValue}deg)`);
      continue;
    }
  }
  return [transforms.join(" ")];
};
