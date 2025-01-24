import { computed, signal, effect as signalsEffect } from "@preact/signals";
import { animationsCanPlaySignal } from "./animation_signal.js";
import { createAnimationAbortError } from "./utils/animation_abort_error.js";

const noop = () => {};
const createPlaybackController = (
  executor,
  {
    delay = 0,
    usage = "display",
    onstatechange = noop,
    onstart = noop,
    onpause = noop,
    onremove = noop,
    onfinish = noop,
    autoplay = true,
  } = {},
) => {
  let resolveFinished;
  let rejectFinished;
  const createFinishedPromise = () => {
    return new Promise((resolve, reject) => {
      resolveFinished = resolve;
      rejectFinished = reject;
    });
  };

  const playbackController = {
    onstatechange,
    onstart,
    onpause,
    onremove,
    onfinish,
  };

  const cleanupCallbackSet = new Set();
  const playRequestedSignal = signal(autoplay);
  // "idle", "running", "paused", "removed", "finished"
  const stateSignal = signal("idle");
  let isWaitingDelayToStart;
  let isPlaying;
  let pauseMethod;
  let resumeMethod;
  let finishMethod;
  let stopMethod;
  const delayController = createDelayedCallbackController(delay, () => {
    if (isWaitingDelayToStart) {
      isWaitingDelayToStart = false;
      const executorReturnValue = executor();
      pauseMethod = executorReturnValue.pause;
      finishMethod = executorReturnValue.finish;
      stopMethod = executorReturnValue.stop;
      executorReturnValue.onfinish = () => {
        applyFinishedEffects();
      };
      return;
    }
    if (resumeMethod) {
      resumeMethod();
      resumeMethod = null;
    }
  });

  const goToState = (newState) => {
    const currentState = stateSignal.peek();
    stateSignal.value = newState;
    playbackController.onstatechange(newState, currentState);
    if (newState === "running") {
      playbackController.onstart();
    } else if (newState === "paused") {
      playbackController.onpause();
    } else if (newState === "finished") {
      playbackController.onfinish();
    } else if (newState === "removed") {
      playbackController.onremove();
    }
  };

  const shouldPlaySignal = computed(() => {
    const playRequested = playRequestedSignal.value;
    const state = stateSignal.value;
    const animationsCanPlay = animationsCanPlaySignal.value;
    if (!playRequested) {
      return false;
    }
    if (state === "running") {
      return false;
    }
    if (state === "removed") {
      return false;
    }
    if (!animationsCanPlay && usage === "display") {
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
      if (!shouldPlay) {
        return;
      }
      const state = stateSignal.peek();
      if (state === "running" || state === "removed") {
        return;
      }
      if (!isPlaying) {
        isPlaying = true;
        isWaitingDelayToStart = true;
        playbackController.finished = createFinishedPromise();
        delayController.start();
        goToState("running");
        return;
      }
      delayController.start();
      goToState("running");
    }),
  );
  cleanupCallbackSet.add(
    signalsEffect(() => {
      const shouldPause = shouldPauseSignal.value;
      if (!shouldPause) {
        return;
      }
      const state = stateSignal.peek();
      if (state !== "running") {
        return;
      }
      if (isWaitingDelayToStart) {
        delayController.pause();
        goToState("paused");
        return;
      }
      resumeMethod = pauseMethod();
      goToState("paused");
      return;
    }),
  );

  const applyFinishedEffects = () => {
    resolveFinished();
    resolveFinished = undefined;
    isPlaying = false;
    goToState("finished");
  };

  playbackController.play = () => {
    playRequestedSignal.value = true;
  };
  playbackController.pause = () => {
    playRequestedSignal.value = false;
  };
  playbackController.remove = () => {
    const state = stateSignal.peek();
    if (state === "removed") {
      return;
    }
    delayController.remove();
    if (stopMethod) {
      stopMethod();
      stopMethod = undefined;
    }
    if (rejectFinished) {
      rejectFinished(createAnimationAbortError());
      rejectFinished = undefined;
    }
    for (const cleanupCallback of cleanupCallbackSet) {
      cleanupCallback();
    }
    cleanupCallbackSet.clear();
    isPlaying = false;
    goToState("removed");
  };
  playbackController.finish = () => {
    const state = stateSignal.peek();
    if (state === "idle") {
      return;
    }
    if (state === "running" || state === "paused") {
      delayController.remove();
      if (finishMethod) {
        finishMethod();
        finishMethod = undefined;
      }
      applyFinishedEffects();
    }
  };

  return playbackController;
};
const createDelayedCallbackController = (ms, callback) => {
  let remainingMs = ms;
  let timeout;
  let startMs;

  const controller = {
    needsToWait: () => {
      return remainingMs > 0;
    },
    start: () => {
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

export const animateRatio = ({
  type = "ratio_animation",
  effect,
  duration = 300,
  fps, // rename speed?
  easing,
  loop = false,
  isAudio = false,
  onprogress = noop,
  ...params
}) => {
  const ratioAnimationCreator = ({ onfinished }) => {
    const requestNext = isAudio
      ? (callback) => {
          let timeout = setTimeout(callback, 1000 / 60);
          return () => {
            clearTimeout(timeout);
            timeout = null;
          };
        }
      : (callback) => {
          let frame = requestAnimationFrame(callback);
          return () => {
            cancelAnimationFrame(frame);
            frame = null;
          };
        };

    let progressRatio = 0;
    let ratio = 0;
    let cancelNext;
    let msRemaining = duration;
    let previousStepMs = Date.now();

    const setProgressRatio = (value) => {
      progressRatio = value;
      ratio = easing ? easing(progressRatio) : progressRatio;
      effect(ratio);
      onprogress(progressRatio);
    };
    const stepMinDuration = fps ? 1000 / fps : 0;
    const next = () => {
      const stepMs = Date.now();
      const msEllapsedSincePreviousStep = stepMs - previousStepMs;
      const msRemainingAfterThisStep =
        msRemaining - msEllapsedSincePreviousStep;
      if (
        // we reach the end, round progress to 1
        msRemainingAfterThisStep <= 0 ||
        // we are very close from the end, round progress to 1
        msRemainingAfterThisStep <= 16.6
      ) {
        if (loop) {
          setProgressRatio(1);
          msRemaining = duration;
          progressRatio = 0;
          ratio = 0;
          previousStepMs = stepMs;
          cancelNext = requestNext(next);
          return;
        }
        setProgressRatio(1);
        onfinished();
        return;
      }
      if (msEllapsedSincePreviousStep < stepMinDuration) {
        cancelNext = requestNext(next);
        return;
      }
      previousStepMs = stepMs;
      msRemaining = msRemainingAfterThisStep;
      setProgressRatio(progressRatio + msEllapsedSincePreviousStep / duration);
      cancelNext = requestNext(next);
    };

    effect(0);
    cancelNext = requestNext(next);

    return {
      pause: () => {
        if (cancelNext) {
          cancelNext();
          cancelNext = undefined;
        }
        return () => {
          cancelNext = requestNext(next);
        };
      },
      finish: () => {
        if (cancelNext) {
          // cancelNext is undefined when "idle" or "paused"
          cancelNext();
          cancelNext = undefined;
        }
        setProgressRatio(1);
      },
      stop: () => {
        if (cancelNext) {
          // cancelNext is undefined when "idle", "paused" or "finished"
          cancelNext();
          cancelNext = undefined;
        }
        previousStepMs = null;
        progressRatio = 0;
        ratio = 0;
        effect(0);
      },
    };
  };

  return createPlaybackController(ratioAnimationCreator, {
    type,
    isAudio,
    ...params,
  });
};
