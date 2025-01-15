import { createAnimationAbortError } from "../utils/animation_abort_error.js";

export const animateSequence = (
  animationExecutors,
  {
    onstart = () => {},
    oncancel = () => {},
    onpause = () => {},
    onfinish = () => {},
  } = {},
) => {
  let resolveFinished;
  let rejectFinished;
  let childAnimationIndex;
  let currentAnimation;
  const animationSequence = {
    playState: "idle",
    finished: null,
    onstart,
    oncancel,
    onpause,
    onfinish,
    play: () => {
      if (animationSequence.playState === "running") {
        return;
      }
      if (animationSequence.playState === "paused") {
        animationSequence.playState = "running";
        currentAnimation.play();
      } else {
        childAnimationIndex = -1;
        currentAnimation = null;
        animationSequence.playState = "running";
        animationSequence.finished = new Promise((resolve, reject) => {
          resolveFinished = resolve;
          rejectFinished = reject;
        });
        startNext();
      }
    },
    pause: () => {
      if (currentAnimation) {
        currentAnimation.pause();
      }
      animationSequence.playState = "paused";
      animationSequence.onpause();
    },
    finish: () => {
      if (currentAnimation) {
        currentAnimation.finish();
        while (childAnimationIndex < animationExecutors.length) {
          const nextAnimation = animationExecutors[childAnimationIndex]();
          childAnimationIndex++;
          nextAnimation.finish();
        }
        currentAnimation = null;
      }
      animationSequence.playState = "finished";
      resolveFinished();
      animationSequence.onfinish();
    },
    cancel: () => {
      currentAnimation.cancel();
      rejectFinished(createAnimationAbortError());
      animationSequence.oncancel();
    },
  };
  const startNext = () => {
    childAnimationIndex++;
    if (childAnimationIndex >= animationExecutors.length) {
      currentAnimation = null;
      animationSequence.finish();
      return;
    }
    currentAnimation = animationExecutors[childAnimationIndex]();
    currentAnimation.onfinish = () => {
      if (animationSequence.playState === "running") {
        startNext();
      }
    };
    currentAnimation.oncancel = () => {
      animationSequence.cancel();
    };
  };
  animationSequence.play();
  return animationSequence;
};
