import { useEffect } from "preact/hooks";

export const useKeyEffect = (keyCallbacks) => {
  const deps = [];
  const keys = Object.keys(keyCallbacks);
  const effects = {};
  for (const key of keys) {
    deps.push(key);
    const keyEffect = keyCallbacks[key];
    if (typeof keyEffect === "function") {
      deps.push(keyEffect);
      effects[key] = { enabled: true, callback: keyEffect };
    } else {
      const { enabled, callback } = keyEffect;
      deps.push(enabled, callback);
      effects[key] = keyEffect;
    }
  }

  useEffect(() => {
    const onKeyDown = (event) => {
      const eventKey = event.key;
      const keyEffect = keyCallbacks[eventKey];
      if (keyEffect?.enabled) {
        event.preventDefault();
        keyEffect.callback();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, deps);
};
