import { signal } from "@preact/signals";
import { createPlaybackController } from "/playback/playback_controller.js";
import { visualContentPlaybackIsPreventedSignal } from "/playback/visual_content_playback.js";

export const animateFrames = (
  frames,
  { msBetweenFrames = 350, loop = true, ...params } = {},
) => {
  const frameContentCreator = () => {
    const frameSignal = signal();
    let index;
    let lastIndex = frames.length - 1;

    return {
      type: "frame_animation",
      playbackPreventedSignal: visualContentPlaybackIsPreventedSignal,
      frameSignal,
      start: ({ finished }) => {
        let paused;

        const setFrameIndex = (value) => {
          index = value;
          frameSignal.value = frames[index];
        };

        setFrameIndex(0);
        let interval = setInterval(() => {
          if (paused) {
            return;
          }
          if (index === lastIndex) {
            if (!loop) {
              clearInterval(interval);
              finished();
              return;
            }
            setFrameIndex(0);
            return;
          }
          setFrameIndex(index + 1);
        }, msBetweenFrames);

        return {
          pause: () => {
            paused = true;
            return () => {
              paused = false;
            };
          },
          finish: () => {
            setFrameIndex(lastIndex);
            clearInterval(interval);
            finished();
          },
          stop: () => {
            index = undefined;
            clearInterval(interval);
            interval = undefined;
            paused = false;
          },
        };
      },
    };
  };
  return createPlaybackController(frameContentCreator, params);
};
