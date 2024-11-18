export const EASING = {
  EASE_OUT_EXPO: (x) => {
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
  },
};

export const animateNumber = ({ from, to, duration, easing }) => {
  let animationFrame;
  let resolveFinished;
  const animatedNumber = {
    value: from,
    progressRatio: 0,
    onprogress: () => {},
    onfinish: () => {},
    oncancel: () => {},
    cancel: () => {
      startMs = null;
      cancelAnimationFrame(animationFrame);
      animatedNumber.oncancel();
    },
    finished: new Promise((resolve) => {
      resolveFinished = resolve;
    }),
  };
  const finish = () => {
    animatedNumber.onfinish();
    resolveFinished();
  };
  const progress = (ratio) => {
    if (easing) {
      ratio = easing(ratio);
    }
    animatedNumber.progressRatio = ratio;
    const value = (to - from) * ratio;
    animatedNumber.value = value;
    animatedNumber.onprogress();
    if (ratio === 1) {
      finish();
    } else {
      animationFrame = requestAnimationFrame(next);
    }
  };
  let startMs = Date.now();
  const next = () => {
    const msEllapsed = Date.now() - startMs;
    if (msEllapsed >= duration) {
      progress(1);
      return;
    }
    const msBeforeFinish = duration - msEllapsed;
    if (msBeforeFinish < 16.6) {
      progress(1);
      return;
    }
    progress(msEllapsed / duration);
  };
  animationFrame = requestAnimationFrame(next);
  return animatedNumber;
};

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

export const serieOfAnimations = (animationExecutors) => {
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
