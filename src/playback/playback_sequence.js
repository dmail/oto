// TODO: we should not use onfinish
// because it might be overriden from outside
// we should use a list of listeners

import { createPlaybackController } from "./playback_controller.js";

export const createPlaybackSequenceController = (childCallbacks, params) => {
  const sequenceCreator = () => {
    let childIndex;
    let currentPlaybackController;

    const getNextPlaybackController = () => {
      const isFirst = childIndex === 0;
      const isLast = childIndex === childCallbacks.length - 1;
      const childCallback = childCallbacks[childIndex];
      const nextPlaybackController = childCallback({
        index: childIndex,
        isFirst,
        isLast,
      });
      // nextAnimation.canPlayWhileGloballyPaused = true; // ensure subanimation cannot play/pause on its own
      childIndex++;
      return nextPlaybackController;
    };

    return {
      start: ({ finished, playbackController }) => {
        childIndex = 0;
        const startNext = () => {
          if (childIndex === childCallbacks.length) {
            currentPlaybackController = undefined;
            finished();
            return;
          }
          currentPlaybackController = getNextPlaybackController();
          currentPlaybackController.onpause = () => {
            playbackController.pause();
          };
          currentPlaybackController.onplay = () => {
            playbackController.play();
          };
          currentPlaybackController.onfinish = () => {
            const state = playbackController.stateSignal.peek();
            if (state === "running") {
              startNext();
            }
          };
          currentPlaybackController.onremove = () => {
            playbackController.remove();
          };
        };
        startNext();
      },
      pause: () => {
        if (currentPlaybackController) {
          currentPlaybackController.pause();
          return () => {
            currentPlaybackController.play();
          };
        }
        return () => {};
      },
      finish: () => {
        if (currentPlaybackController) {
          currentPlaybackController.finish();
          while (childIndex < childCallbacks.length) {
            const nextPlaybackController = getNextPlaybackController();
            nextPlaybackController.finish();
          }
          currentPlaybackController = null;
        }
      },
      stop: () => {
        if (currentPlaybackController) {
          currentPlaybackController.stop();
          currentPlaybackController = undefined;
        }
      },
      remove: () => {
        if (currentPlaybackController) {
          currentPlaybackController.remove();
          currentPlaybackController = undefined;
        }
      },
    };
  };

  return createPlaybackController(sequenceCreator, {
    ...params,
  });
};
