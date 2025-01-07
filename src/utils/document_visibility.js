import { signal } from "@preact/signals";

export const documentHiddenSignal = signal(document.hidden);
document.addEventListener("visibilitychange", () => {
  documentHiddenSignal.value = document.hidden;
});
