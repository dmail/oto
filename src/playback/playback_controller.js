import { effect, signal } from "@preact/signals";

const noop = () => {};
export const createPlaybackController = (
  contentCreator,
  {
    onstatechange = noop,
    onstart = noop,
    onpause = noop,
    onremove = noop,
    onfinish = noop,
    autoplay = true,
  } = {},
) => {
  // "idle", "running", "paused", "removed", "finished"
  const stateSignal = signal("idle");
  let resolveFinished;
  let rejectFinished;
  const createFinishedPromise = () => {
    return new Promise((resolve, reject) => {
      resolveFinished = resolve;
      rejectFinished = reject;
    });
  };
  let content = contentCreator();
  const cleanupCallbackSet = new Set();
  const playRequestedSignal = signal(autoplay);
  let resumeMethod;
  const playbackPreventedSignal =
    content.playbackPreventedSignal || signal(false);
  const goToState = (newState) => {
    const currentState = stateSignal.peek();
    stateSignal.value = newState;
    playbackController.onstatechange(newState, currentState);
    if (newState === "running") {
      playbackController.onstart();
    } else if (newState === "paused") {
      playbackController.onpause();
    } else if (newState === "finished") {
      playbackController.onfinish();
    } else if (newState === "removed") {
      playbackController.onremove();
    }
  };
  const playbackController = {
    stateSignal,
    onstatechange,
    onstart,
    onpause,
    onremove,
    onfinish,
    finished: createFinishedPromise(),
    content,

    play: () => {
      playRequestedSignal.value = true;
    },
    pause: () => {
      const state = stateSignal.peek();
      if (state === "running" || state === "finished") {
        playRequestedSignal.value = false;
        resumeMethod = content.pause?.();
        goToState("paused");
      }
    },
    remove: () => {
      const state = stateSignal.peek();
      if (state === "removed") {
        return;
      }
      if (state === "running" || state === "paused" || state === "finished") {
        content.stop?.();
        content.remove?.();
      }
      resumeMethod = undefined;
      if (rejectFinished) {
        rejectFinished(createPlaybackAbortError());
        rejectFinished = undefined;
      }
      for (const cleanupCallback of cleanupCallbackSet) {
        cleanupCallback();
      }
      playbackController.finished = undefined;
      cleanupCallbackSet.clear();
      content = undefined;
      goToState("removed");
    },
    finish: () => {
      const state = stateSignal.peek();
      if (state === "running" || state === "paused") {
        content.finish?.();
        return;
      }
    },
  };

  cleanupCallbackSet.add(
    effect(() => {
      const playRequested = playRequestedSignal.value;
      const playbackPrevented = playbackPreventedSignal.value;
      if (!playRequested) {
        return;
      }
      if (playbackPrevented) {
        return;
      }
      const state = stateSignal.peek();
      if (state === "running" || state === "removed") {
        return;
      }
      if (state === "idle" || state === "finished") {
        if (state === "finished") {
          playbackController.finished = createFinishedPromise();
        }
        content.start({
          playbackController,
          finished: () => {
            resolveFinished();
            resolveFinished = undefined;
            goToState("finished");
            playRequestedSignal.value = false;
          },
        });
        goToState("running");
        return;
      }
      if (state === "paused") {
        resumeMethod();
        resumeMethod = undefined;
        goToState("running");
        return;
      }
    }),
  );

  return playbackController;
};

const createPlaybackAbortError = () => {
  const playbackAbortError = new Error("Playback aborted");
  playbackAbortError.name = "AbortError";
  playbackAbortError.isPlaybackAbortError = true;
  return playbackAbortError;
};
window.addEventListener("unhandledrejection", (event) => {
  const { reason } = event;
  if (reason && reason.name === "AbortError" && reason.isPlaybackAbortError) {
    event.preventDefault();
  }
});
