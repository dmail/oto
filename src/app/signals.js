import { signal } from "@preact/signals";

export const pausedSignal = signal(false);
export const pause = () => {
  pausedSignal.value = true;
};
export const play = () => {
  pausedSignal.value = false;
};
