// TODO: we should not use onfinish
// because it might be overriden from outside
// we should use a list of listeners

import { signal, effect as signalsEffect } from "@preact/signals";
import { animationsAllPausedSignal } from "../animation_signal.js";
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
  const playRequestedSignal = signal(autoplay);
  const playStateSignal = signal("idle");

  let resolveFinished;
  let rejectFinished;
  let childIndex;
  let currentAnimation;
  let removeSignalEffect;
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

  const getNextAnimation = () => {
    const isFirst = childIndex === 0;
    const isLast = childIndex === animationExecutors.length - 1;
    const animationExecutor = animationExecutors[childIndex];
    const nextAnimation = animationExecutor({
      index: childIndex,
      isFirst,
      isLast,
    });
    // nextAnimation.canPlayWhileGloballyPaused = true; // ensure subanimation cannot play/pause on its own
    childIndex++;
    return nextAnimation;
  };

  let started = false;
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
      playRequestedSignal.value = true;
    },
    pause: () => {
      playRequestedSignal.value = false;
    },
    finish: () => {
      const playState = playStateSignal.peek();
      if (playState === "finished") {
        return;
      }
      if (currentAnimation) {
        currentAnimation.finish();
        while (childIndex < animationExecutors.length) {
          const nextAnimation = getNextAnimation();
          nextAnimation.finish();
        }
        currentAnimation = null;
      }
      started = false;
      goToState("finished");
      resolveFinished();
    },
    remove: () => {
      const playState = playStateSignal.peek();
      if (playState === "idle") {
        return;
      }
      if (removeSignalEffect) {
        removeSignalEffect();
        removeSignalEffect = undefined;
      }
      currentAnimation.remove();
      started = false;
      goToState("removed");
      rejectFinished(createAnimationAbortError());
    },
  };
  const startNext = () => {
    if (childIndex === animationExecutors.length) {
      currentAnimation = null;
      animationSequence.finish();
      return;
    }
    currentAnimation = getNextAnimation();
    currentAnimation.onpause = () => {
      animationSequence.pause();
      currentAnimation.onplay = () => {
        currentAnimation.onplay = null;
        if (playRequestedSignal.peek()) {
          animationSequence.play();
        }
      };
    };
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

  const doPlay = () => {
    const playState = playStateSignal.peek();
    if (playState === "running" || playState === "removed") {
      return;
    }
    if (!started) {
      childIndex = 0;
      currentAnimation = null;
      animationSequence.finished = new Promise((resolve, reject) => {
        resolveFinished = resolve;
        rejectFinished = reject;
      });
      animationSequence.onbeforestart();
      startNext();
      goToState("running");
      return;
    }
    animationSequence.onbeforestart();
    currentAnimation.play();
    goToState("running");
  };
  const doPause = () => {
    const playState = playStateSignal.peek();
    if (playState === "paused") {
      return;
    }
    if (currentAnimation) {
      currentAnimation.pause();
    }
    goToState("paused");
  };

  removeSignalEffect = signalsEffect(() => {
    const playRequested = playRequestedSignal.value;
    const animationsAllPaused = animationsAllPausedSignal.value;
    const shouldPlay =
      playRequested &&
      (animationSequence.canPlayWhileGloballyPaused || !animationsAllPaused);
    if (shouldPlay) {
      doPlay();
    } else {
      doPause();
    }
  });

  return animationSequence;
};
