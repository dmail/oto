import { effect, signal } from "@preact/signals";

// pas d'interaction avec la page? le jeu est en muted
// et le joueur doit explicitement activer le son en cliquant dessus
// see navigator.userActivation.hasBeenActive
// https://developer.mozilla.org/en-US/docs/Web/API/UserActivation

const { userActivation } = window.navigator;

const localStorageItem = localStorage.getItem("muted");
const mutedInLocalStorage =
  localStorageItem === undefined ? false : JSON.parse(localStorageItem);
const gotUserActivation =
  userActivation.isActive && !userActivation.hasBeenActive;

export const mutedSignal = signal(mutedInLocalStorage || !gotUserActivation);
export const mute = () => {
  mutedSignal.value = true;
};
export const unmute = () => {
  mutedSignal.value = false;
};

effect(() => {
  const muted = mutedSignal.value;
  localStorage.setItem("muted", JSON.stringify(muted));
});
