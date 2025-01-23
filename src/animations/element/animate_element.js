import { computed, effect, signal } from "@preact/signals";
import { animationsAllPausedSignal } from "../animation_signal.js";
import { createAnimationAbortError } from "../utils/animation_abort_error.js";
import { EASING } from "../utils/easing.js";

const noop = () => {};

export const animateElement = (
  element,
  {
    id,
    from,
    to,
    duration = 500,
    delay,
    iterations = 1,
    fill = "forwards",
    playbackRate = 1,
    onstatechange = noop,
    onstart = noop,
    onprogress = noop,
    onpause = noop,
    onfinish = noop,
    onremove = noop,
    easing,
    canPlayWhileGloballyPaused,
    autoplay = true,
  },
) => {
  const cleanupCallbackSet = new Set();
  const playRequestedSignal = signal(autoplay);
  const stateSignal = signal("idle");
  const fromStep = stepFromAnimationDescription(from);
  const toStep = stepFromAnimationDescription(to);

  const goToState = (newState) => {
    const currentState = stateSignal.peek();
    stateSignal.value = newState;
    animation.onstatechange(newState, currentState);
    if (newState === "running") {
      animation.onstart();
    } else if (newState === "paused") {
      animation.onpause();
    } else if (newState === "finished") {
      animation.onfinish();
    } else if (newState === "removed") {
      animation.onremove();
    }
  };

  const steps = [];
  if (fromStep) {
    steps.push(fromStep);
  }
  if (toStep) {
    steps.push(toStep);
  }
  if (easing) {
    element.style.animationTimingFunction =
      createAnimationTimingFunction(easing);
  } else {
    element.style.animationTimingFunction = "";
  }
  const keyFrames = new KeyframeEffect(element, steps, {
    id,
    duration,
    delay,
    fill,
    iterations,
  });
  const webAnimation = new Animation(keyFrames, document.timeline);
  webAnimation.playbackRate = playbackRate;
  let stopObservingElementRemoved;
  const createFinishedPromise = () => {
    return webAnimation.finished.catch(() => {
      throw createAnimationAbortError();
    });
  };
  let innerOnFinish;
  const onBeforePlay = () => {
    const computedStyle = getComputedStyle(element);
    if (computedStyle.display === "none") {
      element.style.display = null;
      innerOnFinish = () => {
        element.style.display = "none";
      };
    }
  };
  let started = false;

  const animation = {
    canPlayWhileGloballyPaused,
    stateSignal,
    onstatechange,
    onstart,
    onprogress,
    onpause,
    onremove,
    onfinish,
    finished: createFinishedPromise(),
    play: () => {
      playRequestedSignal.value = true;
    },
    pause: () => {
      playRequestedSignal.value = false;
    },
    finish: () => {
      const state = stateSignal.peek();
      if (state === "finished") {
        return;
      }
      webAnimation.finish();
    },
    remove: () => {
      const state = stateSignal.peek();
      if (state === "removed") {
        return;
      }
      webAnimation.cancel();
      if (stopObservingElementRemoved) {
        stopObservingElementRemoved();
        stopObservingElementRemoved = undefined;
      }
      for (const cleanupCallback of cleanupCallbackSet) {
        cleanupCallback();
      }
      cleanupCallbackSet.clear();
      started = false;
      goToState("removed");
    },
  };

  const doPlay = () => {
    const state = stateSignal.peek();
    if (state === "running" || state === "removed") {
      return;
    }
    if (!started) {
      stopObservingElementRemoved = onceElementRemoved(element, () => {
        animation.remove();
      });
      webAnimation.onfinish = () => {
        if (toStep) {
          try {
            webAnimation.commitStyles();
          } catch (e) {
            console.error(
              `Error during "commitStyles" on animation "${id}"`,
              element.style.display,
            );
            console.error(e);
          }
        }
        if (innerOnFinish) {
          innerOnFinish();
          innerOnFinish = null;
        }
        started = false;
        goToState("finished");
        // play is no longer requested once it finishes
        // the play method must be called again
        playRequestedSignal.value = false;
      };
      onBeforePlay();
      webAnimation.play();
      if (animation.playState === "finished") {
        animation.finished = createFinishedPromise();
      }
      goToState("running");
      started = true;
      return;
    }
    onBeforePlay();
    webAnimation.play();
    goToState("running");
    return;
  };
  const doPause = () => {
    const state = stateSignal.peek();
    if (state === "paused" || state === "removed" || state === "finished") {
      return;
    }
    webAnimation.pause();
    goToState("paused");
  };
  const shouldPlaySignal = computed(() => {
    const playRequested = playRequestedSignal.value;
    const animationsAllPaused = animationsAllPausedSignal.value;
    if (!playRequested) {
      return false;
    }
    if (animationsAllPaused && !canPlayWhileGloballyPaused) {
      return false;
    }
    return true;
  });
  cleanupCallbackSet.add(
    effect(() => {
      const shouldPlay = shouldPlaySignal.value;
      if (shouldPlay) {
        doPlay();
      }
    }),
  );
  const shouldPauseSignal = computed(() => {
    const playRequested = playRequestedSignal.value;
    if (playRequested) {
      return false;
    }
    return true;
  });
  cleanupCallbackSet.add(
    effect(() => {
      const shouldPause = shouldPauseSignal.value;
      if (shouldPause) {
        doPause();
      }
    }),
  );

  return animation;
};

export const stepFromAnimationDescription = (animationDescription) => {
  if (!animationDescription) {
    return null;
  }
  const step = {};
  transform: {
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
    if (transforms.length) {
      step.transform = transforms.join(" ");
    }
  }
  opacity: {
    let opacity = animationDescription.opacity;
    if (opacity !== undefined) {
      step.opacity = opacity;
    }
  }
  if (Object.keys(step).length === 0) {
    return null;
  }
  return step;
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
