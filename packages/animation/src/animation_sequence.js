export const animationSequence = (animationExecutors) => {
  let resolveFinished;
  const animationSerie = {
    oncancel: () => {},
    cancel: () => {
      currentAnimation.cancel();
    },
    onfinish: () => {},
    finished: new Promise((resolve) => {
      resolveFinished = resolve;
    }),
  };
  let childAnimationIndex = -1;
  let currentAnimation = null;
  const startNext = () => {
    childAnimationIndex++;
    if (childAnimationIndex >= animationExecutors.length) {
      resolveFinished();
      animationSerie.onfinish();
      return;
    }
    currentAnimation = animationExecutors[childAnimationIndex]();
    currentAnimation.onfinish = () => {
      startNext();
    };
  };
  startNext();
  return animationSerie;
};
