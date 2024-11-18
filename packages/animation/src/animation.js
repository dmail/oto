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

const glowDuration = 300;
const glowStepDuration = glowDuration / 3;
export const glow = (
  canvas,
  { x = 0, y = 0, width = canvas.width, height = canvas.height } = {},
) => {
  const context = canvas.getContext("2d");
  const imageData = context.getImageData(x, y, width, height);
  const allColors = imageData.data;
  const pixelIndexes = [];
  for (let i = 0, n = allColors.length; i < n; i += 4) {
    const r = allColors[i];
    const g = allColors[i + 1];
    const b = allColors[i + 2];
    if (r === 0 && g === 0 && b === 0) {
      pixelIndexes.push(i);
    }
  }
  const setBlackPixelColor = (value) => {
    const [r, g, b] = value;
    for (const pixelIndex of pixelIndexes) {
      allColors[pixelIndex] = r;
      allColors[pixelIndex + 1] = g;
      allColors[pixelIndex + 2] = b;
    }
    // context.clearRect(0, 0, width, height);
    context.putImageData(imageData, 0, 0);
  };

  return serieOfAnimations([
    () => turnIntoWhite(setBlackPixelColor),
    () => turnIntoBlack(setBlackPixelColor),
    () => turnIntoWhite(setBlackPixelColor),
    () => turnIntoBlack(setBlackPixelColor),
  ]);
};
const turnIntoWhite = (setBlackPixelColor) => {
  const blackToWhiteColorAnimation = animateNumber({
    from: 0,
    to: 255,
    duration: glowStepDuration,
    easing: EASING.EASE_OUT_EXPO,
  });
  blackToWhiteColorAnimation.onprogress = () => {
    setBlackPixelColor([
      blackToWhiteColorAnimation.value,
      blackToWhiteColorAnimation.value,
      blackToWhiteColorAnimation.value,
    ]);
  };
  blackToWhiteColorAnimation.onprogress();
  return blackToWhiteColorAnimation;
};
const turnIntoBlack = (setBlackPixelColor) => {
  const whiteToBlackColorAnimation = animateNumber({
    from: 255,
    to: 0,
    duration: glowStepDuration,
    easing: EASING.EASE_OUT_EXPO,
  });
  whiteToBlackColorAnimation.onprogress = () => {
    setBlackPixelColor([
      whiteToBlackColorAnimation.value,
      whiteToBlackColorAnimation.value,
      whiteToBlackColorAnimation.value,
    ]);
  };
  whiteToBlackColorAnimation.onprogress();
  return whiteToBlackColorAnimation;
};
