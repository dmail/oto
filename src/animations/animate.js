import { effect as signalsEffect } from "@preact/signals";
import { animationsAllPausedSignal } from "./animation_signal.js";
import { createAnimationAbortError } from "./utils/animation_abort_error.js";

const noop = () => {};

export const animate = ({
  duration = 300,
  fps,
  easing,
  effect = noop,
  onprogress = noop,
  onstart = noop,
  onpause = noop,
  oncancel = noop,
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

  const animation = {
    playState: "idle", // "idle", "running", "paused", "canceled", "finished"
    progressRatio: 0,
    ratio: 0,
    effect,
    onstart,
    onprogress,
    onpause,
    oncancel,
    onfinish,
    finished: createFinishedPromise(),
    play: () => {
      if (animation.playState === "paused") {
        previousStepMs = Date.now();
        cancelNext = requestNext(next);
        animation.playState = "running";
        return;
      }
      if (
        animation.playState === "idle" ||
        animation.playState === "finished"
      ) {
        previousStepMs = Date.now();
        msRemaining = duration;
        if (animation.playState === "finished") {
          animation.finished = createFinishedPromise();
        }
        animation.progressRatio = 0;
        animation.ratio = 0;
        animation.playState = "running";
        animation.effect(animation.ratio, animation);
        cancelNext = requestNext(next);
        animation.onstart();
        return;
      }
    },
    pause: () => {
      if (animation.playState === "running") {
        cancelNext();
        cancelNext = undefined;
        animation.playState = "paused";
        animation.onpause();
        return;
      }
    },
    finish: () => {
      if (
        animation.playState === "idle" ||
        animation.playState === "running" ||
        animation.playState === "paused"
      ) {
        if (cancelNext) {
          // cancelNext is undefined when "idle" or "paused"
          cancelNext();
          cancelNext = undefined;
        }
        setProgress(1);
        animation.playState = "finished";
        resolveFinished();
        resolveFinished = undefined;
        animation.onfinish();
      }
    },
    cancel: () => {
      if (
        animation.playState === "idle" ||
        animation.playState === "running" ||
        animation.playState === "paused" ||
        animation.playState === "finished"
      ) {
        if (cancelNext) {
          // cancelNext is undefined when "idle", "paused" or "finished"
          cancelNext();
          cancelNext = undefined;
        }
        previousStepMs = null;
        animation.progressRatio = animation.ratio = 0;
        animation.effect(animation.ratio, animation);
        animation.playState = "canceled";
        if (rejectFinished) {
          rejectFinished(createAnimationAbortError());
          rejectFinished = undefined;
        }
        if (removeSignalEffect) {
          removeSignalEffect();
          removeSignalEffect = undefined;
        }
        animation.oncancel();
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
        animation.playState = "finished";
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
  }
  return animation;
};
