export const composeAnimations = (animations) => {
  let resolveFinished;
  let animationFinishedCounter;
  const composedAnimation = {
    playState: "idle",
    finished: null,
    oncancel: () => {},
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
      composedAnimation.finished = new Promise((resolve) => {
        resolveFinished = resolve;
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
      composedAnimation.oncancel();
    },
    onfinish: () => {},
  };
  composedAnimation.play();
  return composedAnimation;
};
