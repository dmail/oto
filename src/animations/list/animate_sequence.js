import { createAnimationAbortError } from "../utils/animation_abort_error.js";

export const animateSequence = (
  animationExecutors,
  {
    onstart = () => {},
    onpause = () => {},
    onremove = () => {},
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
    onpause,
    onremove,
    onfinish,
    play: () => {
      if (animationSequence.playState === "running") {
        return;
      }
      if (animationSequence.playState === "paused") {
        animationSequence.playState = "running";
        currentAnimation.play();
        animationSequence.onstart();
        return;
      }
      childAnimationIndex = -1;
      currentAnimation = null;
      animationSequence.playState = "running";
      animationSequence.finished = new Promise((resolve, reject) => {
        resolveFinished = resolve;
        rejectFinished = reject;
      });
      startNext();
      animationSequence.onstart();
    },
    pause: () => {
      if (animationSequence.playState === "paused") {
        return;
      }
      if (currentAnimation) {
        currentAnimation.pause();
      }
      animationSequence.playState = "paused";
      animationSequence.onpause();
    },
    finish: () => {
      if (animationSequence.playState === "finished") {
        return;
      }
      if (currentAnimation) {
        currentAnimation.finish();
        const isFirst = childAnimationIndex === 0;
        const isLast = childAnimationIndex === animationExecutors.length - 1;
        while (childAnimationIndex < animationExecutors.length) {
          const nextAnimation = animationExecutors[childAnimationIndex]({
            index: childAnimationIndex,
            isFirst,
            isLast,
          });
          childAnimationIndex++;
          nextAnimation.finish();
        }
        currentAnimation = null;
      }
      animationSequence.playState = "finished";
      resolveFinished();
      animationSequence.onfinish();
    },
    remove: () => {
      if (animationSequence.playState === "idle") {
        return;
      }
      currentAnimation.remove();
      rejectFinished(createAnimationAbortError());
      animationSequence.onremove();
      animationSequence.playState = "idle";
    },
  };
  const startNext = () => {
    childAnimationIndex++;
    if (childAnimationIndex >= animationExecutors.length) {
      currentAnimation = null;
      animationSequence.finish();
      return;
    }
    const isFirst = childAnimationIndex === 0;
    const isLast = childAnimationIndex === animationExecutors.length - 1;
    currentAnimation = animationExecutors[childAnimationIndex]({
      index: childAnimationIndex,
      isFirst,
      isLast,
    });
    currentAnimation.onfinish = () => {
      if (animationSequence.playState === "running") {
        startNext();
      }
    };
    currentAnimation.onremove = () => {
      animationSequence.remove();
    };
  };
  animationSequence.play();
  return animationSequence;
};
