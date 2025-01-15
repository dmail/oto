import { effect } from "@preact/signals";
import { animationsAllPausedSignal } from "../animation_signal.js";
import { createAnimationAbortError } from "../utils/animation_abort_error.js";
import { EASING } from "../utils/easing.js";

const noop = () => {};

export const animateElement = (
  element,
  {
    // id,
    from,
    to,
    duration = 500,
    iterations = 1,
    fill = "forwards",
    playbackRate = 1,
    onstart = noop,
    onprogress = noop,
    onpause = noop,
    onfinish = noop,
    onremove = noop,
    easing,
    canPlayWhilePaused,
  },
) => {
  const [fromTransform] = stepFromAnimationDescription(from);
  const [toTransform] = stepFromAnimationDescription(to);

  const steps = [];
  if (fromTransform) {
    steps.push({ transform: fromTransform });
  }
  steps.push({ transform: toTransform });
  if (easing) {
    element.style.animationTimingFunction =
      createAnimationTimingFunction(easing);
  } else {
    element.style.animationTimingFunction = "";
  }
  const keyFrames = new KeyframeEffect(element, steps, {
    duration,
    fill,
    iterations,
  });
  const webAnimation = new Animation(keyFrames, document.timeline);
  webAnimation.playbackRate = playbackRate;
  let removeSignalEffect;
  let stopObservingElementRemoved;
  const createFinishedPromise = () => {
    return webAnimation.finished.then(
      () => {
        webAnimation.commitStyles();
      },
      () => {
        throw createAnimationAbortError();
      },
    );
  };
  const animation = {
    playState: "idle",
    onstart,
    onprogress,
    onpause,
    onremove,
    onfinish,
    finished: createFinishedPromise(),
    play: () => {
      if (animation.playState === "running") {
        return;
      }
      if (animation.playState === "paused") {
        webAnimation.play();
        animation.playState = "running";
        return;
      }
      stopObservingElementRemoved = onceElementRemoved(element, () => {
        animation.remove();
      });
      webAnimation.onfinish = () => {
        animation.onfinish();
      };
      webAnimation.play();
      if (animation.playState === "finished") {
        animation.finished = createFinishedPromise();
      }
      animation.playState = "running";
      animation.onstart();
    },
    pause: () => {
      if (animation.playState === "paused") {
        return;
      }
      webAnimation.pause();
      animation.playState = "paused";
      animation.onpause();
    },
    finish: () => {
      if (animation.playState === "finished") {
        return;
      }
      webAnimation.finish();
      animation.playState = "finished";
    },
    remove: () => {
      if (animation.playState === "removed") {
        return;
      }
      webAnimation.cancel();
      if (stopObservingElementRemoved) {
        stopObservingElementRemoved();
        stopObservingElementRemoved = undefined;
      }
      if (removeSignalEffect) {
        removeSignalEffect();
        removeSignalEffect = undefined;
      }
      animation.playState = "removed";
    },
  };
  if (canPlayWhilePaused) {
    animation.play();
  } else {
    removeSignalEffect = effect(() => {
      const animationsAllPaused = animationsAllPausedSignal.value;
      if (animationsAllPaused) {
        animation.pause();
      } else {
        animation.play();
      }
    });
  }
  return animation;
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

const createAnimationTimingFunction = (easing, steps = 10) => {
  if (easing === EASING.linear) {
    return "linear";
  }
  if (easing === EASING.EASE) {
    return "ease";
  }
  let i = 0;
  const values = [];
  const stepRatio = 1 / steps;
  let progress = 0;
  while (i < steps) {
    i++;
    const value = easing(progress);
    values.push(value);
    progress += stepRatio;
  }
  return `linear(${values.join(", ")});`;
};

const onceElementRemoved = (element, callback) => {
  const observer = new MutationObserver(function (mutations) {
    let mutationForRemoval;
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      const { removedNodes } = mutation;
      if (removedNodes.length === 0) {
        continue;
      }
      for (const removedNode of removedNodes) {
        if (removedNode === element) {
          mutationForRemoval = mutation;
          break;
        }
      }
      if (mutationForRemoval) {
        break;
      }
    }
    if (mutationForRemoval) {
      observer.disconnect();
      callback();
    }
  });
  observer.observe(element.parentNode, { childList: true });
  return () => {
    observer.disconnect();
  };
};
