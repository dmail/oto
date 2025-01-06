import { useEffect, useRef, useState } from "preact/hooks";

export const useSubscription = (initialValue, subscribe) => {
  const cleanupRef = useRef(null);
  const [globalVolume, globalVolumeSetter] = useState(initialValue);
  if (cleanupRef.current === null) {
    cleanupRef.current = subscribe(globalVolumeSetter);
  }
  useEffect(() => {
    return () => {
      cleanupRef.current();
      cleanupRef.current = null;
    };
  }, []);
  return globalVolume;
};
