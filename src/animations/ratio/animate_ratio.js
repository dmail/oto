import { visualAnimationsPlaybackPreventedSignal } from "../visual_animations.js";
import { createPlaybackController } from "/playback/playback_controller.js";

export const animateRatio = ({
  type = "ratio_animation",
  effect,
  duration = 300,
  fps,
  easing,
  loop = false,
  isAudio = false,
  onprogress = () => {},
  ...params
}) => {
  const ratioAnimationCreator = () => {
    let finishedCallback;
    const requestNext = isAudio
      ? requestAudioAnimationCallback
      : requestVisualAnimationCallback;
    let progressRatio;
    let ratio;
    let cancelNext;
    let msRemaining;
    let previousStepMs;
    const setProgressRatio = (value) => {
      progressRatio = value;
      ratio = easing ? easing(progressRatio) : progressRatio;
      effect(ratio);
      onprogress(progressRatio);
    };
    const stepMinDuration = fps ? 1000 / fps : 0;
    const next = () => {
      const stepMs = Date.now();
      const msEllapsedSincePreviousStep = stepMs - previousStepMs;
      const msRemainingAfterThisStep =
        msRemaining - msEllapsedSincePreviousStep;
      if (
        // we reach the end, round progress to 1
        msRemainingAfterThisStep <= 0 ||
        // we are very close from the end, round progress to 1
        msRemainingAfterThisStep <= 16.6
      ) {
        if (loop) {
          setProgressRatio(1);
          msRemaining = content.duration;
          progressRatio = 0;
          ratio = 0;
          previousStepMs = stepMs;
          cancelNext = requestNext(next);
          return;
        }
        setProgressRatio(1);
        finishedCallback();
        finishedCallback = undefined;
        return;
      }
      if (msEllapsedSincePreviousStep < stepMinDuration) {
        cancelNext = requestNext(next);
        return;
      }
      previousStepMs = stepMs;
      msRemaining = msRemainingAfterThisStep;
      setProgressRatio(
        progressRatio + msEllapsedSincePreviousStep / content.duration,
      );
      cancelNext = requestNext(next);
    };

    const content = {
      type,
      duration,
      playbackPreventedSignal: isAudio
        ? null
        : visualAnimationsPlaybackPreventedSignal,
      start: ({ finished }) => {
        finishedCallback = finished;
        progressRatio = 0;
        ratio = 0;
        msRemaining = content.duration;
        previousStepMs = Date.now();
        effect(0);
        cancelNext = requestNext(next);
      },
      pause: () => {
        if (cancelNext) {
          cancelNext();
          cancelNext = undefined;
        }
        return () => {
          previousStepMs = Date.now();
          cancelNext = requestNext(next);
        };
      },
      finish: () => {
        if (cancelNext) {
          // cancelNext is undefined when "idle" or "paused"
          cancelNext();
          cancelNext = undefined;
        }
        setProgressRatio(1);
      },
      stop: () => {
        if (cancelNext) {
          // cancelNext is undefined when "idle", "paused" or "finished"
          cancelNext();
          cancelNext = undefined;
        }
        previousStepMs = undefined;
        progressRatio = undefined;
        ratio = undefined;
        finishedCallback = undefined;
      },
      remove: () => {
        // nothing to cleanup?
      },
    };
    return content;
  };

  return createPlaybackController(ratioAnimationCreator, {
    ...params,
  });
};
const requestAudioAnimationCallback = (callback) => {
  let timeout = setTimeout(callback, 1000 / 60);
  return () => {
    clearTimeout(timeout);
    timeout = null;
  };
};
const requestVisualAnimationCallback = (callback) => {
  let frame = requestAnimationFrame(callback);
  return () => {
    cancelAnimationFrame(frame);
    frame = null;
  };
};
