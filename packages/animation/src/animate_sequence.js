export const animateSequence = (
  animationExecutors,
  { onfinish = () => {}, oncancel = () => {} } = {},
) => {
  let resolveFinished;
  let childAnimationIndex;
  let currentAnimation;
  const animationSequence = {
    playState: "idle",
    finished: null,
    play: () => {
      if (animationSequence.playState === "running") return;
      if (animationSequence.playState === "paused") {
        animationSequence.playState = "running";
        currentAnimation.play();
      } else {
        childAnimationIndex = -1;
        currentAnimation = null;
        animationSequence.playState = "running";
        animationSequence.finished = new Promise((resolve) => {
          resolveFinished = resolve;
        });
        startNext();
      }
    },
    pause: () => {
      animationSequence.playState = "paused";
      if (currentAnimation) {
        currentAnimation.pause();
      }
    },
    finish: () => {
      animationSequence.playState = "finished";
      if (currentAnimation) {
        currentAnimation.finish();
        while (childAnimationIndex < animationExecutors.length) {
          const nextAnimation = animationExecutors[childAnimationIndex]();
          childAnimationIndex++;
          nextAnimation.finish();
        }
        currentAnimation = null;
      }
      resolveFinished();
      animationSequence.onfinish();
    },
    cancel: () => {
      currentAnimation.cancel();
      animationSequence.oncancel();
    },
    onfinish,
    oncancel,
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
  };
  animationSequence.play();
  return animationSequence;
};
