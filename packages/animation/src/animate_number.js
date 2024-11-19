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
