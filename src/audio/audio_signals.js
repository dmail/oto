import { computed, effect, signal } from "@preact/signals";

// https://developer.mozilla.org/en-US/docs/Web/API/UserActivation
const { userActivation } = window.navigator;
const getUserActivationState = () => {
  if (userActivation.isActive) {
    return "active";
  }
  if (userActivation.hasBeenActive) {
    return "hasBeenActive";
  }
  return "inactive";
};
const userActivationSignal = signal(getUserActivationState());
if (userActivationSignal.value === "inactive") {
  const onmousedown = (mousedownEvent) => {
    if (!mousedownEvent.isTrusted) {
      return;
    }
    userActivationSignal.value = getUserActivationState();
    document.removeEventListener("mousedown", onmousedown, { capture: true });
    document.removeEventListener("keydown", onkeydown, { capture: true });
  };
  const onkeydown = (keydownEvent) => {
    if (!keydownEvent.isTrusted) {
      return;
    }
    userActivationSignal.value = getUserActivationState();
    document.removeEventListener("mousedown", onmousedown, { capture: true });
    document.removeEventListener("keydown", onkeydown, { capture: true });
  };
  document.addEventListener("mousedown", onmousedown, { capture: true });
  document.addEventListener("keydown", onkeydown, { capture: true });
}

const localStorageItem = localStorage.getItem("muted");
const mutedFromLocalStorage =
  localStorageItem === undefined ? false : JSON.parse(localStorageItem);
const innerMutedSignal = signal(mutedFromLocalStorage || false);

export const mutedSignal = computed(() => {
  const userActivation = userActivationSignal.value;
  const innerMuted = innerMutedSignal.value;
  if (userActivation === "inactive") {
    return true;
  }
  return innerMuted;
});

export const mute = () => {
  innerMutedSignal.value = true;
};
export const unmute = () => {
  innerMutedSignal.value = false;
};

effect(() => {
  const innerMuted = innerMutedSignal.value;
  localStorage.setItem("muted", JSON.stringify(innerMuted));
});

export const audioPausedSignal = signal(false);
export const pause = () => {
  audioPausedSignal.value = true;
};
export const play = () => {
  audioPausedSignal.value = false;
};
