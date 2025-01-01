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

export const useVolume = (media) => {
  const { audio } = media;
  const volumechangeRef = useRef(true);
  const [volume, setVolume] = useState(audio.volume);

  if (volumechangeRef.current === null) {
    const volumechange = () => {
      setVolume(audio.volume);
    };
    audio.addEventListener("volumechange", volumechange);
    volumechangeRef.current = volumechange;
  }

  useEffect(() => {
    return () => {
      audio.removeEventListener("volumechange", volumechangeRef.current);
      volumechangeRef.current = null;
    };
  }, []);

  return volume;
};
