import { createAnimationAbortError } from "./animation_abort_error.js";

export const composeAnimations = (animations) => {
  let resolveFinished;
  let rejectFinished;
  let animationFinishedCounter;
  const composedAnimation = {
    playState: "idle",
    finished: null,
    play: () => {
      if (composedAnimation.playState === "running") {
        return;
      }
      if (
        composedAnimation.playState === "paused" ||
        composedAnimation.playState === "finished"
      ) {
        for (const animation of animations) {
          animation.play();
        }
        composedAnimation.playState = "running";
        return;
      }
      composedAnimation.finished = new Promise((resolve, reject) => {
        resolveFinished = resolve;
        rejectFinished = reject;
      });
      animationFinishedCounter = 0;
      for (const animation of animations) {
        // eslint-disable-next-line no-loop-func
        animation.onfinish = () => {
          animationFinishedCounter++;
          if (animationFinishedCounter === animations.length) {
            composedAnimation.onfinish();
            resolveFinished();
          }
        };
        // eslint-disable-next-line no-loop-func
        animation.oncancel = () => {
          rejectFinished(createAnimationAbortError());
          composedAnimation.oncancel();
        };
      }
    },
    pause: () => {
      for (const animation of animations) {
        animation.pause();
      }
      composedAnimation.playState = "paused";
    },
    finish: () => {
      for (const animation of animations) {
        animation.finish();
      }
      composedAnimation.playState = "finished";
    },
    cancel: () => {
      for (const animation of animations) {
        animation.cancel();
      }
      composedAnimation.playState = "idle";
      composedAnimation.oncancel();
    },
    oncancel: () => {},
    onfinish: () => {},
  };
  composedAnimation.play();
  return composedAnimation;
};
