import { useState } from "preact/hooks";

export const useLocalStorageState = (key, initialValue) => {
  const get = () => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  };
  const fromStorage = (initialValue = get());
  if (fromStorage !== undefined) {
    initialValue = fromStorage;
  }
  const [value, valueSetter] = useState(initialValue);
  const set = (value) => {
    localStorage.setItem(key, JSON.stringify(value));
    valueSetter(value);
  };
  return [value, set];
};
