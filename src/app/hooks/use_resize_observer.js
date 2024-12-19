import { useEffect, useRef, useState } from "preact/hooks";

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
  const onResizeRef = useRef(onResize);
  const boxProp =
    box === "border-box"
      ? "borderBoxSize"
      : box === "device-pixel-content-box"
        ? "devicePixelContentBoxSize"
        : "contentBoxSize";

  useEffect(() => {
    isMountedRef.current = true;

    let elementToObserve = ref.current;
    if (!elementToObserve) {
      return null;
    }
    elementToObserve = getElementToObserveRef.current(elementToObserve);
    if (!elementToObserve) {
      return null;
    }
    const observer = new ResizeObserver(([entry]) => {
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
        observer.unobserve(elementToObserve);
        onResizeRef.current(newSize);
        observer.observe(elementToObserve);
      } else if (isMountedRef.current) {
        sizeSetter(newSize);
      }
    });
    observer.observe(elementToObserve, { box });
    return () => {
      isMountedRef.current = false;
      observer.disconnect();
    };
  }, [box, ref, isMountedRef]);
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
