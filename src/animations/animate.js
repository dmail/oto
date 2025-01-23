import { effect as signalsEffect } from "@preact/signals";
import { animationsAllPausedSignal } from "./animation_signal.js";
import { createAnimationAbortError } from "./utils/animation_abort_error.js";

const noop = () => {};

export const animate = ({
  duration = 300,
  delay = 0,
  fps,
  easing,
  effect = noop,
  onprogress = noop,
  onstatechange = noop,
  onstart = noop,
  onpause = noop,
  onremove = noop,
  onfinish = noop,
  loop = false,
  usage = "display",
}) => {
  const requestNext =
    usage === "audio"
      ? (callback) => {
          const timeout = setTimeout(callback, 1000 / 60);
          return () => {
            clearTimeout(timeout);
          };
        }
      : (callback) => {
          requestAnimationFrame(callback);
          return () => {
            cancelAnimationFrame(callback);
          };
        };

  let cancelNext;
  const delayController = createDelayController(delay);
  let resolveFinished;
  let rejectFinished;
  let previousStepMs;
  let msRemaining;
  let removeSignalEffect;
  const createFinishedPromise = () => {
    return new Promise((resolve, reject) => {
      resolveFinished = resolve;
      rejectFinished = reject;
    });
  };

  const goToState = (newState) => {
    const currentState = animation.playState;
    animation.playState = newState;
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

  const animation = {
    playState: "idle", // "idle", "running", "paused", "removed", "finished"
    progressRatio: 0,
    ratio: 0,
    effect,
    onprogress,
    onstatechange,
    onstart,
    onpause,
    onremove,
    onfinish,
    finished: createFinishedPromise(),
    play: () => {
      if (animation.playState === "paused") {
        delayController.nowOrOnceDelayEllapsed(() => {
          previousStepMs = Date.now();
          goToState("running");
          cancelNext = requestNext(next);
        });
        return;
      }
      if (
        animation.playState === "idle" ||
        animation.playState === "finished"
      ) {
        msRemaining = duration;
        if (animation.playState === "finished") {
          animation.finished = createFinishedPromise();
        }
        animation.progressRatio = 0;
        animation.ratio = 0;
        goToState("running");
        delayController.nowOrOnceDelayEllapsed(() => {
          previousStepMs = Date.now();
          animation.effect(animation.ratio, animation);
          cancelNext = requestNext(next);
        });
        return;
      }
    },
    pause: () => {
      if (animation.playState === "running") {
        delayController.pause();
        if (cancelNext) {
          cancelNext();
          cancelNext = undefined;
        }
        goToState("paused");
        return;
      }
    },
    finish: () => {
      if (
        animation.playState === "idle" ||
        animation.playState === "running" ||
        animation.playState === "paused"
      ) {
        delayController.remove();
        if (cancelNext) {
          // cancelNext is undefined when "idle" or "paused"
          cancelNext();
          cancelNext = undefined;
        }
        setProgress(1);
        resolveFinished();
        resolveFinished = undefined;
        goToState("finished");
      }
    },
    remove: () => {
      if (
        animation.playState === "idle" ||
        animation.playState === "running" ||
        animation.playState === "paused" ||
        animation.playState === "finished"
      ) {
        delayController.remove();
        if (cancelNext) {
          // cancelNext is undefined when "idle", "paused" or "finished"
          cancelNext();
          cancelNext = undefined;
        }
        previousStepMs = null;
        animation.progressRatio = animation.ratio = 0;
        animation.effect(animation.ratio, animation);

        if (rejectFinished) {
          rejectFinished(createAnimationAbortError());
          rejectFinished = undefined;
        }
        if (removeSignalEffect) {
          removeSignalEffect();
          removeSignalEffect = undefined;
        }
        goToState("removed");
      }
    },
  };
  const setProgress = (progressRatio) => {
    animation.progressRatio = progressRatio;
    animation.ratio = easing ? easing(progressRatio) : progressRatio;
    animation.effect(animation.ratio, animation);
    animation.onprogress();
  };
  const stepMinDuration = fps ? 1000 / fps : 0;
  const next = () => {
    const stepMs = Date.now();
    const msEllapsedSincePreviousStep = stepMs - previousStepMs;
    const msRemainingAfterThisStep = msRemaining - msEllapsedSincePreviousStep;
    if (
      // we reach the end, round progress to 1
      msRemainingAfterThisStep <= 0 ||
      // we are very close from the end, round progress to 1
      msRemainingAfterThisStep <= 16.6
    ) {
      if (loop) {
        setProgress(1);
        goToState("idle");
        animation.play();
        return;
      }
      animation.finish();
      return;
    }
    if (msEllapsedSincePreviousStep < stepMinDuration) {
      cancelNext = requestNext(next);
      return;
    }
    previousStepMs = stepMs;
    msRemaining = msRemainingAfterThisStep;
    setProgress(
      animation.progressRatio + msEllapsedSincePreviousStep / duration,
    );
    cancelNext = requestNext(next);
  };
  if (usage === "display") {
    removeSignalEffect = signalsEffect(() => {
      const animationsAllPaused = animationsAllPausedSignal.value;
      if (animationsAllPaused) {
        animation.pause();
      } else {
        animation.play();
      }
    });
  } else {
    animation.play();
  }
  return animation;
};

const createDelayController = (ms) => {
  let remainingMs = ms;
  let timeout;
  let startMs;

  const controller = {
    nowOrOnceDelayEllapsed: (callback) => {
      if (remainingMs <= 0) {
        callback();
        return;
      }
      startMs = Date.now();
      timeout = setTimeout(() => {
        remainingMs = 0;
        callback();
      }, remainingMs);
    },
    pause: () => {
      if (timeout === undefined) {
        return;
      }
      const ellapsedMs = startMs - Date.now();
      startMs = undefined;
      remainingMs -= ellapsedMs;
      clearTimeout(timeout);
      timeout = undefined;
    },
    remove: () => {
      if (timeout !== undefined) {
        clearTimeout(timeout);
        timeout = undefined;
      }
    },
  };

  return controller;
};
