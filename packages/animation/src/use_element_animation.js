import { useCallback, useLayoutEffect, useMemo, useRef } from "preact/hooks";

const noop = () => {};

export const useElementAnimation = ({
  id,
  elementRef,
  from,
  to,
  duration = 500,
  iterations = 1,
  fill = "forwards",
  onStart = noop,
  onCancel = noop,
  onFinish = noop,
  playWhen,
}) => {
  const [fromTransform] = stepFromAnimationDescription(from);
  const [toTransform] = stepFromAnimationDescription(to);
  const animationRef = useRef();

  const play = useCallback(() => {
    const element = elementRef.current;
    if (!element) {
      console.warn("no element");
      return;
    }
    const steps = [];
    if (fromTransform) {
      steps.push({ transform: fromTransform });
    }
    steps.push({ transform: toTransform });
    const animation = element.animate(steps, {
      duration,
      fill,
      iterations,
    });
    animationRef.current = animation;
    animation.oncancel = () => {
      animationRef.current = null;
      onCancel();
    };
    animation.onfinish = onFinish;
    animation.finished.then(
      () => {
        animation.commitStyles();
      },
      () => {
        // ignore cancellation
      },
    );
    onStart();
  }, [
    id,
    elementRef.current,
    fromTransform,
    toTransform,
    duration,
    fill,
    iterations,
    onStart,
    onCancel,
    onFinish,
  ]);
  const pause = useCallback(() => {
    const animation = animationRef.current;
    if (!animation) {
      return;
    }
    animation.pause();
  }, []);
  const cancel = useCallback(() => {
    const animation = animationRef.current;
    if (!animation) {
      return;
    }
    if (animation.playState !== "finished") {
      animation.cancel();
    }
  }, []);

  useLayoutEffect(() => {
    if (playWhen) {
      if (elementRef.current) {
        play();
      }
    }
    return () => {
      cancel();
    };
  }, [play, cancel, playWhen, elementRef.current]);

  return useMemo(() => {
    return { play, pause, cancel };
  }, [play, pause, cancel]);
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
