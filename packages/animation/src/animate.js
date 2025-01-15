import { createAnimationAbortError } from "./animation_abort_error.js";

export const animate = ({
  duration = 300,
  fps,
  easing,
  effect = () => {},
  onprogress = () => {},
  onstart = () => {},
  onfinish = () => {},
  oncancel = () => {},
  loop = false,
  canPlayWhenDocumentIsHidden,
}) => {
  const requestNextFrame = canPlayWhenDocumentIsHidden
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

  let cancelNextFrame;
  let resolveFinished;
  let rejectFinished;
  let previousStepMs;
  let msRemaining;
  const animation = {
    playState: "idle",
    progressRatio: 0,
    ratio: 0,
    effect,
    onprogress,
    onfinish,
    oncancel,
    finished: null,
    play: () => {
      if (animation.playState === "running") {
        return;
      }
      if (animation.playState === "paused") {
        animation.playState = "running";
        previousStepMs = Date.now();
      } else {
        animation.playState = "running";
        previousStepMs = Date.now();
        msRemaining = duration;
        animation.finished = new Promise((resolve, reject) => {
          resolveFinished = resolve;
          rejectFinished = reject;
        });
        animation.progressRatio = 0;
        animation.ratio = 0;
        animation.effect(animation.ratio, animation);
        onstart();
      }
      cancelNextFrame = requestNextFrame(next);
    },
    pause: () => {
      if (animation.playState === "paused") {
        return;
      }
      cancelNextFrame();
      animation.playState = "paused";
    },
    finish: () => {
      if (animation.playState === "finished") {
        return;
      }
      cancelNextFrame();
      setProgress(1);
      animation.playState = "finished";
      resolveFinished();
      animation.onfinish();
    },
    cancel: () => {
      if (animation.playState === "idle") {
        return;
      }
      cancelNextFrame();
      previousStepMs = null;
      animation.playState = "idle";
      animation.progressRatio = animation.ratio = 0;
      animation.effect(animation.ratio, animation);
      rejectFinished(createAnimationAbortError());
      animation.oncancel();
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
      cancelNextFrame = requestNextFrame(next);
      return;
    }
    previousStepMs = stepMs;
    msRemaining = msRemainingAfterThisStep;
    setProgress(
      animation.progressRatio + msEllapsedSincePreviousStep / duration,
    );
    cancelNextFrame = requestNextFrame(next);
  };
  animation.play();
  return animation;
};
