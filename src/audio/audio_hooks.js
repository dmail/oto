import { useEffect, useRef, useState } from "preact/hooks";

export const useAudio = (media) => {
  const { play, pause } = media;

  useEffect(() => {
    return () => {
      media.pause();
    };
  }, []);

  return [play, pause];
};

export const useMuted = (media) => {
  const { audio } = media;
  const cleanupRef = useRef(null);
  const [muted, setMuted] = useState(audio.muted);

  if (cleanupRef.current === null) {
    const volumechange = () => {
      setMuted(audio.muted);
    };
    audio.addEventListener("volumechange", volumechange);
    cleanupRef.current = () => {
      audio.removeEventListener("volumechange", volumechange);
    };
  }

  useEffect(() => {
    return () => {
      cleanupRef.current();
      cleanupRef.current = null;
    };
  }, []);

  return muted;
};

export const useVolume = (media) => {
  const { audio } = media;
  const cleanupRef = useRef(null);
  const [volume, setVolume] = useState(audio.volume);

  if (cleanupRef.current === null) {
    const volumechange = () => {
      setVolume(audio.volume);
    };
    audio.addEventListener("volumechange", volumechange);
    cleanupRef.current = () => {
      audio.removeEventListener("volumechange", volumechange);
    };
  }

  useEffect(() => {
    return () => {
      cleanupRef.current();
      cleanupRef.current = null;
    };
  }, []);

  return volume;
};

export const usePlaybackState = (media) => {
  const { audio } = media;
  const [playbackState, setPlaybackState] = useState(getPlaybackState(audio));
  const cleanupRef = useRef(null);

  if (cleanupRef.current === null) {
    const onplay = () => {
      setPlaybackState("playing");
    };
    const onpause = () => {
      setPlaybackState("paused");
    };
    audio.addEventListener("play", onplay);
    audio.addEventListener("pause", onpause);
    cleanupRef.current = () => {
      audio.removeEventListener("play", onplay);
      audio.removeEventListener("pause", onpause);
    };
  }

  useEffect(() => {
    return () => {
      cleanupRef.current();
      cleanupRef.current = null;
    };
  }, []);

  return playbackState;
};
const getPlaybackState = (audio) => {
  if (audio.paused) {
    return "paused";
  }
  return "playing";
};
