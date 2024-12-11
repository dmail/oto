import { useEffect } from "preact/hooks";

export const useKeyEffect = (keyCallbacks) => {
  const deps = [];
  const keys = Object.keys(keyCallbacks);
  for (const key of keys) {
    const keyCallback = keyCallbacks[key];
    deps.push(key, keyCallback);
  }

  useEffect(() => {
    const onKeyDown = (event) => {
      const eventKey = event.key;
      const keyCallback = keyCallbacks[eventKey];
      if (keyCallback) {
        event.preventDefault();
        keyCallback();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, deps);
};
