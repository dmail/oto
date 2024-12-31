import { useCallback, useEffect, useRef, useState } from "preact/hooks";

export const useAudio = ({ url, volume = 1 }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  if (audioRef.current === null) {
    const audio = new Audio(url);
    audio.volume = volume;
    audioRef.current = audio;
  }

  useEffect(() => {
    const audio = audioRef.current;
    audio.addEventListener("ended", () => setPlaying(false));
    audio.addEventListener("abort", () => {});
    return () => {
      audio.removeEventListener("ended", () => setPlaying(false));
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const play = useCallback(() => {
    const audio = audioRef.current;
    audio.currentTime = 0;
    audio.play();
  }, []);
  const pause = useCallback(() => {
    const audio = audioRef.current;
    audio.pause();
  }, []);

  return [play, pause, playing];
};
