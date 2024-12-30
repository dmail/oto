import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { useStructuredMemo } from "./use_structured_memo.js";

export const useSound = (props) => {
  return useAudio(props);
};

const useAudio = ({ url, volume = 1 }) => {
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

  return useStructuredMemo({
    playing,
    play,
    pause,
  });
};
