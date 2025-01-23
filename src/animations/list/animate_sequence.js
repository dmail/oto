// TODO: we should not use onfinish
// because it might be overriden from outside
// we should use a list of listeners

import { signal } from "@preact/signals";
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
  const playStateSignal = signal("idle");

  let resolveFinished;
  let rejectFinished;
  let childAnimationIndex;
  let currentAnimation;
  const goToState = (newState) => {
    const currentState = playStateSignal.peek();
    playStateSignal.value = newState;
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
    playStateSignal,
    finished: null,
    onstatechange,
    onbeforestart,
    onstart,
    onpause,
    onremove,
    onfinish,
    play: () => {
      const playState = playStateSignal.peek();
      if (playState === "running") {
        return;
      }
      if (playState === "paused") {
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
      const playState = playStateSignal.peek();
      if (playState === "paused") {
        return;
      }
      if (currentAnimation) {
        currentAnimation.pause();
      }
      goToState("paused");
    },
    finish: () => {
      const playState = playStateSignal.peek();
      if (playState === "finished") {
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
      const playState = playStateSignal.peek();
      if (playState === "idle") {
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
      const playState = playStateSignal.peek();
      if (playState === "running") {
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
