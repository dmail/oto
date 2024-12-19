import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "preact/hooks";

export const useResizeObserver = ({
  ref,
  getElementToObserve = (refElement) => refElement,
  onResize,
  ignoreInitial = false,
}) => {
  const [size, sizeSetter] = useState({
    width: undefined,
    height: undefined,
  });
  const isMountedRef = useRef(false);
  const previousSizeRef = useRef(size);
  const getElementToObserveRef = useRef(getElementToObserve);
  const elementToObserveRef = useRef(null);

  useLayoutEffect(() => {
    let elementToObserve = ref.current;
    if (!elementToObserve) {
      isMountedRef.current = false;
      return null;
    }
    elementToObserve = getElementToObserveRef.current(elementToObserve);
    if (!elementToObserve) {
      isMountedRef.current = false;
      return null;
    }
    elementToObserveRef.current = elementToObserve;
    if (!isMountedRef.current) {
      const boundingClientRect = elementToObserve.getBoundingClientRect();
      const currentSize = {
        width: boundingClientRect.width,
        height: boundingClientRect.height,
      };
      previousSizeRef.current = currentSize;
      if (!ignoreInitial) {
        sizeSetter(currentSize);
      }
      isMountedRef.current = true;
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [ref, ignoreInitial]);

  const resizeObserverRef = useRef(null);
  const resizeObserverStateRef = useRef("idle");
  const observe = useCallback(() => {
    if (resizeObserverStateRef.state === "observing") {
      return;
    }
    let resizeObserver = resizeObserverRef.current;
    const elementToObserve = elementToObserveRef.current;
    if (!resizeObserver) {
      resizeObserver = new ResizeObserver(([entry]) => {
        if (!entry) {
          return;
        }
        const boundingClientRect = elementToObserve.getBoundingClientRect();
        const newSize = {
          width: boundingClientRect.width,
          height: boundingClientRect.height,
        };
        const hasChanged =
          previousSizeRef.current.width !== newSize.width ||
          previousSizeRef.current.height !== newSize.height;
        if (!hasChanged) {
          return;
        }

        previousSizeRef.current = newSize;

        if (onResize) {
          unobserve();
          onResize(newSize, elementToObserve);
          observe();
        } else if (isMountedRef.current) {
          sizeSetter(newSize);
        }
      });
      resizeObserverRef.current = resizeObserver;
    }
    const boundingClientRect = elementToObserve.getBoundingClientRect();
    previousSizeRef.current = {
      width: boundingClientRect.width,
      height: boundingClientRect.height,
    };
    resizeObserverStateRef.current = "observing";
    resizeObserver.observe(elementToObserve);
  }, [onResize]);
  const unobserve = useCallback(() => {
    if (resizeObserverStateRef.current === "idle") {
      return;
    }
    const resizeObserver = resizeObserverRef.current;
    if (!resizeObserver) {
      return;
    }
    const elementToObserve = elementToObserveRef.current;
    resizeObserverStateRef.current = "idle";
    resizeObserver.unobserve(elementToObserve);
  }, []);

  useEffect(() => {
    observe();
    return () => {
      unobserve();
      resizeObserverRef.current = null;
    };
  }, [ref, onResize, observe, unobserve]);

  return [size.width, size.height, observe, unobserve];
};
