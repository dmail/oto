export const animate = ({
  duration,
  easing,
  onprogress = () => {},
  onfinish = () => {},
  oncancel = () => {},
}) => {
  let animationFrame;
  let resolveFinished;
  let startMs;
  const animation = {
    playState: "idle",
    progressRatio: 0,
    onprogress,
    onfinish,
    oncancel,
    play: () => {
      if (animation.playState === "running") return;
      if (animation.playState === "paused") {
        animation.playState = "running";
        startMs = Date.now();
      } else {
        animation.playState = "running";
        startMs = Date.now();
        animation.progressRatio = 0;
      }
      animationFrame = requestAnimationFrame(next);
    },
    pause: () => {
      if (animation.playState === "paused") return;
      cancelAnimationFrame(animationFrame);
      animation.playState = "paused";
    },
    finish: () => {
      if (animation.playState === "finished") return;
      cancelAnimationFrame(animationFrame);
      animation.progressRatio = 1;
      animation.onprogress();
      animation.playState = "finished";
      animation.onfinish();
      resolveFinished();
    },
    cancel: () => {
      startMs = null;
      cancelAnimationFrame(animationFrame);
      animation.oncancel();
    },
    finished: new Promise((resolve) => {
      resolveFinished = resolve;
    }),
  };
  const progress = (ratio) => {
    if (easing) {
      ratio = easing(ratio);
    }
    if (ratio === 1) {
      animation.finish();
    } else {
      animation.progressRatio = ratio;
      animation.onprogress();
      animationFrame = requestAnimationFrame(next);
    }
  };
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
  animation.play();
  return animation;
};
