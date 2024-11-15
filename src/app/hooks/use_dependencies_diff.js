import { useMemo, useRef } from "preact/hooks";

export const useDependenciesDiff = (inputs) => {
  const oldInputsRef = useRef(inputs);
  const inputValuesArray = Object.values(inputs);
  const inputKeysArray = Object.keys(inputs);
  const diffRef = useRef();
  useMemo(() => {
    const oldInputs = oldInputsRef.current;
    const diff = {};
    for (const key of inputKeysArray) {
      const previous = oldInputs[key];
      const current = inputs[key];
      if (previous !== current) {
        diff[key] = { previous, current };
      }
    }
    diffRef.current = diff;
    oldInputsRef.current = inputs;
  }, inputValuesArray);

  return diffRef.current;
};
