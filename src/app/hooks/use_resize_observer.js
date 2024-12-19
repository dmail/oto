import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";

export const useResizeObserver = ({
  ref,
  getElementToObserve = (refElement) => refElement,
  box = "content-box",
  onResize,
  deps = [],
}) => {
  const [size, sizeSetter] = useState({
    width: undefined,
    height: undefined,
  });
  const isMountedRef = useRef(false);
  const previousSizeRef = useRef(size);
  const getElementToObserveRef = useRef(getElementToObserve);
  const elementToObserveRef = useRef(null);
  const onResizeRef = useRef(onResize);
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
      return;
    }
    elementToObserve = getElementToObserveRef.current(elementToObserve);
    if (!elementToObserve) {
      isMountedRef.current = false;
      return;
    }
    if (!isMountedRef.current) {
      const boundingClientRect = elementToObserve.getBoundingClientRect();
      previousSizeRef.current = {
        width: boundingClientRect.width,
        height: boundingClientRect.height,
      };
      isMountedRef.current = true;
    }
    elementToObserveRef.current = elementToObserve;
  }, [ref]);

  const resizeObserverRef = useRef(null);
  const resizeObserverMethodsRef = useRef({
    start: () => {
      if (resizeObserverMethodsRef.current.state === "observing") {
        return;
      }
      let resizeObserver = resizeObserverRef.current;
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
          if (onResizeRef.current) {
            onResizeRef.current(newSize, elementToObserve);
          } else if (isMountedRef.current) {
            sizeSetter(newSize);
          }
        });
        resizeObserverRef.current = resizeObserver;
      }
      const elementToObserve = elementToObserveRef.current;
      const boundingClientRect = elementToObserve.getBoundingClientRect();
      previousSizeRef.current = {
        width: boundingClientRect.width,
        height: boundingClientRect.height,
      };
      resizeObserverMethodsRef.current.state = "observing";
      resizeObserver.observe(elementToObserveRef.current, { box });
    },
    stop: () => {
      if (resizeObserverMethodsRef.current.state === "paused") {
        return;
      }
      const resizeObserver = resizeObserverRef.current;
      if (!resizeObserver) {
        return;
      }
      resizeObserverMethodsRef.current.state = "paused";
      resizeObserver.disconnect();
    },
  });

  useEffect(() => {
    resizeObserverMethodsRef.current.start();
    return () => {
      isMountedRef.current = false;
      resizeObserverMethodsRef.current.stop();
      resizeObserverRef.current = null;
      resizeObserverMethodsRef.current = null;
    };
  }, [box, ref, isMountedRef, ...deps]);

  return [size.width, size.height, resizeObserverMethodsRef.current];
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
