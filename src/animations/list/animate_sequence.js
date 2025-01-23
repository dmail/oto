// TODO: we should not use onfinish
// because it might be overriden from outside
// we should use a list of listeners

import { computed, effect, signal } from "@preact/signals";
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
  const cleanupCallbackSet = new Set();
  const playRequestedSignal = signal(autoplay);
  const stateSignal = signal("idle");

  let resolveFinished;
  let rejectFinished;
  let childIndex;
  let currentAnimation;
  const goToState = (newState) => {
    const currentState = stateSignal.peek();
    stateSignal.value = newState;
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
    stateSignal,
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
      const state = stateSignal.peek();
      if (state === "finished") {
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
      const state = stateSignal.peek();
      if (state === "idle") {
        return;
      }
      for (const cleanupCallback of cleanupCallbackSet) {
        cleanupCallback();
      }
      cleanupCallbackSet.clear();
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
      const state = stateSignal.peek();
      if (state === "running") {
        startNext();
      }
    };
    currentAnimation.onremove = () => {
      animationSequence.remove();
    };
  };

  const doPlay = () => {
    const state = stateSignal.peek();
    if (state === "running" || state === "removed") {
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
      started = true;
      return;
    }
    animationSequence.onbeforestart();
    currentAnimation.play();
    goToState("running");
  };
  const doPause = () => {
    const state = stateSignal.peek();
    if (state === "paused") {
      return;
    }
    if (currentAnimation) {
      currentAnimation.pause();
    }
    goToState("paused");
  };
  const shouldPlaySignal = computed(() => {
    const playRequested = playRequestedSignal.value;
    const state = stateSignal.value;
    const animationsAllPaused = animationsAllPausedSignal.value;
    if (!playRequested) {
      return false;
    }
    if (state === "running") {
      return false;
    }
    if (state === "removed") {
      return false;
    }
    if (animationsAllPaused) {
      return false;
    }
    return true;
  });
  const shouldPauseSignal = computed(() => {
    const playRequested = playRequestedSignal.value;
    const state = stateSignal.value;
    if (playRequested) {
      return false;
    }
    if (state === "paused") {
      return false;
    }
    if (state === "removed") {
      return false;
    }
    return true;
  });
  cleanupCallbackSet.add(
    effect(() => {
      const shouldPlay = shouldPlaySignal.value;
      if (shouldPlay) {
        doPlay();
      }
    }),
  );
  cleanupCallbackSet.add(
    effect(() => {
      const shouldPause = shouldPauseSignal.value;
      if (shouldPause) {
        doPause();
      }
    }),
  );

  return animationSequence;
};
