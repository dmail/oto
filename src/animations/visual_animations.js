import { signal } from "@preact/signals";

export const visualAnimationsPlaybackPreventedSignal = signal(false);
export const useVisualAnimationsPlaybackIsPrevented = () => {
  return visualAnimationsPlaybackPreventedSignal.value;
};
export const preventVisualAnimationsPlayback = () => {
  visualAnimationsPlaybackPreventedSignal.value = true;
};
export const allowVisualAnimationsPlayback = () => {
  visualAnimationsPlaybackPreventedSignal.value = false;
};
