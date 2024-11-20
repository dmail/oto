const noop = () => {};

export const animateElement = ({
  element,
  from,
  to,
  duration = 500,
  iterations = 1,
  fill = "forwards",
  onprogress = noop,
  onfinish = noop,
  oncancel = noop,
}) => {
  const [fromTransform] = stepFromAnimationDescription(from);
  const [toTransform] = stepFromAnimationDescription(to);

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
  animation.oncancel = () => {
    elementAnimation.oncancel();
  };
  animation.onfinish = () => {
    elementAnimation.onfinish();
  };
  animation.finished.then(
    () => {
      animation.commitStyles();
    },
    () => {
      // ignore cancellation
    },
  );
  const elementAnimation = {
    onprogress,
    onfinish,
    oncancel,
    play: () => {
      animation.play();
    },
    pause: () => {
      animation.pause();
    },
    finish: () => {
      animation.finish();
    },
    cancel: () => {
      if (animation.playState !== "finished") {
        animation.cancel();
      }
    },
    finished: animation.finished,
  };
  return elementAnimation;
};

export const stepFromAnimationDescription = (animationDescription) => {
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
