import { computed, signal, effect as signalsEffect } from "@preact/signals";
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
  autoplay = true,
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
          const frame = requestAnimationFrame(callback);
          return () => {
            cancelAnimationFrame(frame);
          };
        };

  const cleanupCallbackSet = new Set();
  const playRequestedSignal = signal(autoplay);
  // "idle", "running", "paused", "removed", "finished"
  const stateSignal = signal("idle");

  let cancelNext;
  const delayController = createDelayController(delay);
  let resolveFinished;
  let rejectFinished;
  let previousStepMs;
  let msRemaining;
  const createFinishedPromise = () => {
    return new Promise((resolve, reject) => {
      resolveFinished = resolve;
      rejectFinished = reject;
    });
  };

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

  let started = false;

  const animation = {
    stateSignal,
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
      playRequestedSignal.value = true;
    },
    pause: () => {
      playRequestedSignal.value = false;
    },
    finish: () => {
      const state = stateSignal.peek();
      if (state === "idle" || state === "running" || state === "paused") {
        delayController.remove();
        if (cancelNext) {
          // cancelNext is undefined when "idle" or "paused"
          cancelNext();
          cancelNext = undefined;
        }
        setProgress(1);
        started = false;
        resolveFinished();
        resolveFinished = undefined;
        goToState("finished");
      }
    },
    remove: () => {
      const state = stateSignal.peek();
      if (
        state === "idle" ||
        state === "running" ||
        state === "paused" ||
        state === "finished"
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
        started = false;
        if (rejectFinished) {
          rejectFinished(createAnimationAbortError());
          rejectFinished = undefined;
        }
        for (const cleanupCallback of cleanupCallbackSet) {
          cleanupCallback();
        }
        cleanupCallbackSet.clear();
        started = false;
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

  const doPlay = () => {
    const state = stateSignal.peek();
    if (state === "running" || state === "removed") {
      return;
    }
    if (!started) {
      msRemaining = duration;
      animation.finished = createFinishedPromise();
      animation.progressRatio = 0;
      animation.ratio = 0;
      started = true;
      goToState("running");
      delayController.nowOrOnceDelayEllapsed(() => {
        previousStepMs = Date.now();
        animation.effect(animation.ratio, animation);
        cancelNext = requestNext(next);
      });

      return;
    }
    goToState("running");
    delayController.nowOrOnceDelayEllapsed(() => {
      previousStepMs = Date.now();
      cancelNext = requestNext(next);
    });
  };
  const doPause = () => {
    const state = stateSignal.peek();
    if (state === "running") {
      delayController.pause();
      if (cancelNext) {
        cancelNext();
        cancelNext = undefined;
      }
      goToState("paused");
      return;
    }
  };
  const shouldPlaySignal = computed(() => {
    const playRequested = playRequestedSignal.value;
    const state = stateSignal.value;
    const animationsAllPaused = animationsAllPausedSignal.value;
    if (!playRequested) {
      return false;
    }
    if (state === "running") {
      return false;
    }
    if (state === "removed") {
      return false;
    }
    if (animationsAllPaused && usage === "display") {
      return false;
    }
    return true;
  });
  const shouldPauseSignal = computed(() => {
    const playRequested = playRequestedSignal.value;
    const state = stateSignal.value;
    if (playRequested) {
      return false;
    }
    if (state === "paused") {
      return false;
    }
    if (state === "removed") {
      return false;
    }
    return true;
  });
  cleanupCallbackSet.add(
    signalsEffect(() => {
      const shouldPlay = shouldPlaySignal.value;
      if (shouldPlay) {
        doPlay();
      }
    }),
  );
  cleanupCallbackSet.add(
    signalsEffect(() => {
      const shouldPause = shouldPauseSignal.value;
      if (shouldPause) {
        doPause();
      }
    }),
  );

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
