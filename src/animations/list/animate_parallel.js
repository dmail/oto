import { createAnimationAbortError } from "../utils/animation_abort_error.js";

export const animateParallel = (
  animations,
  { oncancel = () => {}, onfinish = () => {} } = {},
) => {
  let resolveFinished;
  let rejectFinished;
  let animationFinishedCounter;
  const parallelAnimation = {
    playState: "idle",
    finished: null,
    oncancel,
    onfinish,
    play: () => {
      if (parallelAnimation.playState === "running") {
        return;
      }
      if (
        parallelAnimation.playState === "paused" ||
        parallelAnimation.playState === "finished"
      ) {
        for (const animation of animations) {
          animation.play();
        }
        parallelAnimation.playState = "running";
        return;
      }
      parallelAnimation.finished = new Promise((resolve, reject) => {
        resolveFinished = resolve;
        rejectFinished = reject;
      });
      animationFinishedCounter = 0;
      for (const animation of animations) {
        // eslint-disable-next-line no-loop-func
        animation.onfinish = () => {
          animationFinishedCounter++;
          if (animationFinishedCounter === animations.length) {
            parallelAnimation.onfinish();
            resolveFinished();
          }
        };
        // eslint-disable-next-line no-loop-func
        animation.oncancel = () => {
          rejectFinished(createAnimationAbortError());
          parallelAnimation.oncancel();
        };
      }
    },
    pause: () => {
      if (parallelAnimation.playState === "paused") {
        return;
      }
      for (const animation of animations) {
        animation.pause();
      }
      parallelAnimation.playState = "paused";
    },
    finish: () => {
      if (parallelAnimation.playState === "finished") {
        return;
      }
      for (const animation of animations) {
        animation.finish();
      }
      parallelAnimation.playState = "finished";
    },
    cancel: () => {
      if (parallelAnimation.playState === "canceled") {
        return;
      }
      for (const animation of animations) {
        animation.cancel();
      }
      parallelAnimation.playState = "canceled";
      parallelAnimation.oncancel();
    },
  };
  parallelAnimation.play();
  return parallelAnimation;
};
