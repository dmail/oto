import { useCallback } from "preact/hooks";
import { useAnimate } from "./use_animate.js";

export const useCanvasFrameAnimation = ({ id, elementRef, frames }) => {
  const animate = useCallback(() => {
    const canvas = elementRef.current;
    if (!canvas) {
      console.warn("no canvas");
      return null;
    }

    return animateFrames(canvas, {
      frames,
    });
  }, [id, elementRef.current]);

  return useAnimate({ animate });
};

const animateFrames = (canvas, { frames, msBetweenFrames = 350 }) => {
  let index;
  let lastIndex = frames.length;
  let interval;

  const frameAnimation = {
    playState: "idle",
    play: () => {
      if (frameAnimation.playState === "running") return;
      if (frameAnimation.playState === "paused") {
        frameAnimation.playState = "running";
      } else {
        index = 0;
      }
      setInterval(() => {
        if (index === lastIndex) {
          index = 0;
        } else {
          index++;
        }
        const frame = frames[index];
        const {
          source,
          x = 0,
          y = 0,
          width = canvas.width,
          height = canvas.height,
        } = frame;
        const context = canvas.getContext("2d");
        context.drawImage(
          source,
          x,
          y,
          width,
          height,
          0,
          0,
          canvas.width,
          canvas.height,
        );
      }, msBetweenFrames);
    },
    pause: () => {
      if (frameAnimation.playState === "paused") return;
      clearInterval(interval);
      frameAnimation.playState = "paused";
    },
    cancel: () => {
      clearInterval(interval);
      interval = null;
    },
  };
  frameAnimation.play();
  return frameAnimation;
};
