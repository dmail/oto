import { signal } from "@preact/signals";

export const visualAnimationsPlaybackPreventedSignal = signal(false);
export const preventVisualAnimationsPlayback = () => {
  visualAnimationsPlaybackPreventedSignal.value = true;
};
export const allowVisualAnimationsPlayback = () => {
  visualAnimationsPlaybackPreventedSignal.value = false;
};
