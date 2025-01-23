// TODO: we should not use onfinish
// because it might be overriden from outside
// we should use a list of listeners

import { createAnimationAbortError } from "../utils/animation_abort_error.js";

export const animateSequence = (
  animationExecutors,
  {
    onstatechange = () => {},
    onbeforestart = () => {},
    onstart = () => {},
    onpause = () => {},
    onremove = () => {},
    onfinish = () => {},
    autoplay = true,
  } = {},
) => {
  let resolveFinished;
  let rejectFinished;
  let childAnimationIndex;
  let currentAnimation;
  const goToState = (newState) => {
    const currentState = animationSequence.playState;
    animationSequence.playState = newState;
    animationSequence.onstatechange(newState, currentState);
    if (newState === "running") {
      animationSequence.onstart();
    } else if (newState === "paused") {
      animationSequence.onpause();
    } else if (newState === "finished") {
      animationSequence.onfinish();
    } else if (newState === "removed") {
      animationSequence.onremove();
    }
  };

  const animationSequence = {
    playState: "idle",
    finished: null,
    onstatechange,
    onbeforestart,
    onstart,
    onpause,
    onremove,
    onfinish,
    play: () => {
      if (animationSequence.playState === "running") {
        return;
      }
      if (animationSequence.playState === "paused") {
        animationSequence.onbeforestart();
        currentAnimation.play();
        goToState("running");
        return;
      }
      childAnimationIndex = -1;
      currentAnimation = null;
      animationSequence.finished = new Promise((resolve, reject) => {
        resolveFinished = resolve;
        rejectFinished = reject;
      });
      animationSequence.onbeforestart();
      startNext();
      goToState("running");
    },
    pause: () => {
      if (animationSequence.playState === "paused") {
        return;
      }
      if (currentAnimation) {
        currentAnimation.pause();
      }
      goToState("paused");
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
      goToState("finished");
      resolveFinished();
    },
    remove: () => {
      if (animationSequence.playState === "idle") {
        return;
      }
      currentAnimation.remove();
      goToState("removed");
      rejectFinished(createAnimationAbortError());
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
  if (autoplay) {
    animationSequence.play();
  }
  return animationSequence;
};
