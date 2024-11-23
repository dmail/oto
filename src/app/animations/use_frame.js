import { useCallback, useRef, useState } from "preact/hooks";

export const useFrame = (frames, { msBetweenFrames = 350, loop } = {}) => {
  const intervalRef = useRef();
  const frameIndexRef = useRef(0);
  const playStateRef = useRef("idle");
  const [frame, frameSetter] = useState(frames[0]);
  const play = useCallback(() => {
    if (playStateRef.current === "running") {
      return;
    }
    if (playStateRef.current === "paused") {
    } else {
      frameIndexRef.current = 0;
    }
    playStateRef.current = "running";
    intervalRef.current = setInterval(() => {
      const frameIndex = frameIndexRef.current;
      if (frameIndex === frames.length - 1) {
        if (loop) {
          frameIndexRef.current = 0;
          frameSetter(frames[0]);
        } else {
          clearInterval(intervalRef.current);
        }
      } else {
        frameIndexRef.current++;
        frameSetter(frames[frameIndex + 1]);
      }
    }, msBetweenFrames);
  }, [...frames, msBetweenFrames, loop]);
  const pause = useCallback(() => {
    if (playStateRef.current === "paused") return;
    playStateRef.current = "paused";
    clearInterval(intervalRef.current);
  }, []);

  return [frame, play, pause];
};
