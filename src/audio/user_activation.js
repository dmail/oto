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

const changeCallbackSet = new Set();
const initialState = getUserActivationState();
let state = initialState;
const updateState = () => {
  const newState = getUserActivationState();
  if (newState === state) {
    return false;
  }
  userActivationFacade.ok = newState !== "inactive";
  state = newState;
  for (const callback of changeCallbackSet) {
    callback();
  }
  return true;
};

export const userActivationFacade = {
  ok: state !== "inactive",
  addChangeCallback: (callback) => {
    changeCallbackSet.add(callback);
    return () => {
      changeCallbackSet.delete(callback);
    };
  },
  removeChangeCallback: (callback) => {
    changeCallbackSet.delete(callback);
  },
};

if (state === "inactive") {
  const onmousedown = (mousedownEvent) => {
    if (!mousedownEvent.isTrusted) {
      return;
    }
    if (updateState()) {
      document.removeEventListener("mousedown", onmousedown, { capture: true });
      document.removeEventListener("keydown", onkeydown, { capture: true });
    }
  };
  const onkeydown = (keydownEvent) => {
    if (!keydownEvent.isTrusted) {
      return;
    }
    if (updateState()) {
      document.removeEventListener("mousedown", onmousedown, { capture: true });
      document.removeEventListener("keydown", onkeydown, { capture: true });
    }
  };
  document.addEventListener("mousedown", onmousedown, { capture: true });
  document.addEventListener("keydown", onkeydown, { capture: true });
}
