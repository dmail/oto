const REASON_METHOD_CALL = "method_call";
const REASON_GLOBAL_CALL = "global_call";

const soundSet = new Set();
const globalReasonToBeMutedSet = new Set();

export const addGlobalReasonToBeMuted = (reason) => {
  globalReasonToBeMutedSet.add(reason);
  for (const sound of soundSet) {
    sound.addReasonToBeMuted(reason);
  }
};
export const removeGlobalReasonToBeMuted = (reason) => {
  globalReasonToBeMutedSet.delete(reason);
  for (const sound of soundSet) {
    sound.removeReasonToBeMuted(reason);
  }
};

export const sound = ({
  name,
  url,
  startTime = 0,
  volume = 1,
  restartOnPlay = true,
  muted,
}) => {
  const soundObject = {};
  const audio = new Audio(url);
  audio.volume = volume;
  if (startTime) {
    audio.currentTime = startTime;
  }

  const reasonToBeMutedSet = new Set(globalReasonToBeMutedSet);
  const addReasonToBeMuted = (reason) => {
    reasonToBeMutedSet.add(reason);
    if (soundObject.onReasonToBeMutedChange) {
      soundObject.onReasonToBeMutedChange();
    }
    audio.muted = true;
  };
  const removeReasonToBeMuted = (reason) => {
    reasonToBeMutedSet.delete(reason);
    if (soundObject.onReasonToBeMutedChange) {
      soundObject.onReasonToBeMutedChange();
    }
    if (reasonToBeMutedSet.size > 0) {
      return;
    }
    if (!audio.muted) {
      return;
    }
    audio.muted = false;
  };
  const mute = () => {
    addReasonToBeMuted(REASON_METHOD_CALL);
    audio.muted = true;
  };
  const unmute = () => {
    removeReasonToBeMuted(REASON_METHOD_CALL);
  };
  if (reasonToBeMutedSet.size > 0) {
    audio.muted = true;
  }
  if (muted) {
    mute();
  }

  const reasonToBePausedSet = new Set();
  const addReasonToBePaused = (reason) => {
    reasonToBePausedSet.add(reason);
    if (soundObject.onReasonToBePausedChange) {
      soundObject.onReasonToBePausedChange();
    }
    if (audio.paused) {
      return;
    }
    audio.pause();
  };
  const removeReasonToBePaused = (reason) => {
    reasonToBePausedSet.delete(reason);
    if (reasonToBePausedSet.size > 0) {
      return;
    }
    if (restartOnPlay) {
      audio.currentTime = startTime;
    }
    audio.play();
  };
  const pause = () => {
    addReasonToBePaused(REASON_METHOD_CALL);
  };
  const play = () => {
    removeReasonToBePaused(REASON_METHOD_CALL);
  };
  pause();

  Object.assign(soundObject, {
    audio,
    name,
    url,

    volumeAtStart: volume,
    mute,
    unmute,

    reasonToBeMutedSet,
    addReasonToBeMuted,
    removeReasonToBeMuted,

    play,
    pause,
    reasonToBePausedSet,
    addReasonToBePaused,
    removeReasonToBePaused,
  });
  soundSet.add(soundObject);
  return soundObject;
};

export const muteSounds = () => {
  addGlobalReasonToBeMuted(REASON_GLOBAL_CALL);
};
export const unmuteSounds = () => {
  removeGlobalReasonToBeMuted(REASON_GLOBAL_CALL);
};
