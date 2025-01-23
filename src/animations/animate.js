import { signal, effect as signalsEffect } from "@preact/signals";
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

  const playRequestedSignal = signal(autoplay);
  // "idle", "running", "paused", "removed", "finished"
  const playStateSignal = signal("idle");

  const goToState = (newState) => {
    const currentState = playStateSignal.peek();
    playStateSignal.value = newState;
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
    playStateSignal,
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
      const playState = playStateSignal.peek();
      if (
        playState === "idle" ||
        playState === "running" ||
        playState === "paused"
      ) {
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
      const playState = playStateSignal.peek();
      if (
        playState === "idle" ||
        playState === "running" ||
        playState === "paused" ||
        playState === "finished"
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

  const doPlay = () => {
    const playState = playStateSignal.peek();
    if (playState === "running" || playState === "removed") {
      return;
    }
    if (!started) {
      msRemaining = duration;
      animation.finished = createFinishedPromise();
      animation.progressRatio = 0;
      animation.ratio = 0;
      delayController.nowOrOnceDelayEllapsed(() => {
        previousStepMs = Date.now();
        animation.effect(animation.ratio, animation);
        cancelNext = requestNext(next);
      });
      goToState("running");
      return;
    }
    delayController.nowOrOnceDelayEllapsed(() => {
      previousStepMs = Date.now();
      cancelNext = requestNext(next);
    });
    goToState("running");
  };
  const doPause = () => {
    const playState = playStateSignal.peek();
    if (playState === "running") {
      delayController.pause();
      if (cancelNext) {
        cancelNext();
        cancelNext = undefined;
      }
      goToState("paused");
      return;
    }
  };
  removeSignalEffect = signalsEffect(() => {
    const playRequested = playRequestedSignal.value;
    const animationsAllPaused = animationsAllPausedSignal.value;
    if (playRequested) {
      if (usage === "display") {
        if (animationsAllPaused) {
          doPause();
        } else {
          doPlay();
        }
      } else {
        doPlay();
      }
    } else {
      doPause();
    }
  });

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
