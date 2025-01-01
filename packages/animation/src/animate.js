export const animate = ({
  duration = 300,
  fps,
  easing,
  effect = () => {},
  onprogress = () => {},
  onstart = () => {},
  onfinish = () => {},
  oncancel = () => {},
  loop = false,
}) => {
  let animationFrame;
  let resolveFinished;
  let previousStepMs;
  let msRemaining;
  const animation = {
    playState: "idle",
    progressRatio: 0,
    ratio: 0,
    effect,
    onprogress,
    onfinish,
    oncancel,
    finished: null,
    play: () => {
      if (animation.playState === "running") return;
      if (animation.playState === "paused") {
        animation.playState = "running";
        previousStepMs = Date.now();
      } else {
        animation.playState = "running";
        previousStepMs = Date.now();
        msRemaining = duration;
        animation.finished = new Promise((resolve) => {
          resolveFinished = resolve;
        });
        animation.progressRatio = 0;
        animation.ratio = 0;
        animation.effect(animation.ratio);
        onstart();
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
      setProgress(1);
      animation.playState = "finished";
      resolveFinished();
      animation.onfinish();
    },
    cancel: () => {
      cancelAnimationFrame(animationFrame);
      previousStepMs = null;
      animation.progressRatio = animation.ratio = 0;
      animation.effect(animation.ratio);
      animation.oncancel();
    },
  };
  const setProgress = (progressRatio) => {
    animation.progressRatio = progressRatio;
    animation.ratio = easing ? easing(progressRatio) : progressRatio;
    animation.effect(animation.ratio);
    animation.onprogress();
  };
  const stepMinDuration = fps ? 1000 / fps : 0;
  const next = () => {
    const stepMs = Date.now();
    const msEllapsedSincePreviousStep = stepMs - previousStepMs;
    const msRemainingAfterThisStep = msRemaining - msEllapsedSincePreviousStep;
    if (
      // we reach the end, round progress to 1
      msRemainingAfterThisStep <= 0 ||
      // we are very close from the end, round progress to 1
      msRemainingAfterThisStep <= 16.6
    ) {
      if (loop) {
        setProgress(1);
        animation.playState = "finished";
        animation.play();
        return;
      }
      animation.finish();
      return;
    }
    if (msEllapsedSincePreviousStep < stepMinDuration) {
      animationFrame = requestAnimationFrame(next);
      return;
    }
    previousStepMs = stepMs;
    msRemaining = msRemainingAfterThisStep;
    setProgress(
      animation.progressRatio + msEllapsedSincePreviousStep / duration,
    );
    animationFrame = requestAnimationFrame(next);
  };
  animation.play();
  return animation;
};
