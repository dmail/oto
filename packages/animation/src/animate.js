export const animate = ({
  duration,
  easing,
  onprogress = () => {},
  onfinish = () => {},
  oncancel = () => {},
}) => {
  let animationFrame;
  let resolveFinished;
  const animation = {
    progressRatio: 0,
    onprogress,
    onfinish,
    oncancel,
    cancel: () => {
      startMs = null;
      cancelAnimationFrame(animationFrame);
      animation.oncancel();
    },
    finished: new Promise((resolve) => {
      resolveFinished = resolve;
    }),
  };
  const finish = () => {
    animation.onfinish();
    resolveFinished();
  };
  const progress = (ratio) => {
    if (easing) {
      ratio = easing(ratio);
    }
    animation.progressRatio = ratio;
    animation.onprogress();
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
  return animation;
};
