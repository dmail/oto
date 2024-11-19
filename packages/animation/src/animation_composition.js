export const composeAnimations = (animations) => {
  let resolveFinished;
  const composedAnimation = {
    oncancel: () => {},
    cancel: () => {
      for (const animation of animations) {
        animation.cancel();
      }
      composedAnimation.oncancel();
    },
    onfinish: () => {},
    finished: new Promise((resolve) => {
      resolveFinished = resolve;
    }),
  };
  let animationCancelCounter = 0;
  let animationFinishedCounter = 0;
  for (const animation of animations) {
    // eslint-disable-next-line no-loop-func
    animation.oncancel = () => {
      animationCancelCounter++;
      if (animationCancelCounter === animations.length) {
        composedAnimation.cancel();
      }
    };
    // eslint-disable-next-line no-loop-func
    animation.onfinish = () => {
      animationFinishedCounter++;
      if (animationFinishedCounter === animations.length) {
        composedAnimation.onfinish();
        resolveFinished();
      }
    };
  }
  return composedAnimation;
};
