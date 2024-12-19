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
  box = "content-box",
  onResize,
}) => {
  const [size, sizeSetter] = useState({
    width: undefined,
    height: undefined,
  });
  const isMountedRef = useRef(false);
  const previousSizeRef = useRef(size);
  const getElementToObserveRef = useRef(getElementToObserve);
  const elementToObserveRef = useRef(null);

  const boxProp =
    box === "border-box"
      ? "borderBoxSize"
      : box === "device-pixel-content-box"
        ? "devicePixelContentBoxSize"
        : "contentBoxSize";

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
      previousSizeRef.current = {
        width: boundingClientRect.width,
        height: boundingClientRect.height,
      };
      isMountedRef.current = true;
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [ref]);

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
        const newWidth = extractSize(entry, boxProp, "inlineSize");
        const newHeight = extractSize(entry, boxProp, "blockSize");
        const hasChanged =
          previousSizeRef.current.width !== newWidth ||
          previousSizeRef.current.height !== newHeight;
        if (!hasChanged) {
          return;
        }
        const newSize = { width: newWidth, height: newHeight };
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
    resizeObserver.observe(elementToObserve, { box });
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
  }, [box, ref, onResize, observe, unobserve]);

  return [size.width, size.height, observe, unobserve];
};

const extractSize = (entry, box, sizeType) => {
  if (!entry[box]) {
    if (box === "contentBoxSize") {
      return entry.contentRect[sizeType === "inlineSize" ? "width" : "height"];
    }
    return undefined;
  }
  return Array.isArray(entry[box])
    ? entry[box][0][sizeType]
    : entry[box][sizeType];
};
