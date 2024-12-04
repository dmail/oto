/**
 * This component allow to position and dimension itself as follow:
 * x: "start" | "center" | "end" | number | string (e.g. "50%")
 * y: "start" | "center" | "end" | number | string (e.g. "50%")
 * width: number | string (e.g. "50%") | "auto"
 * height: number | string (e.g. "50%") | "auto"
 * aspectRatio: number
 *
 * Best parts
 * - "start", "center", "end" position allow to position the box
 * dynamically depending on it size
 * - aspectRatio allow width or height to be dertermined accoring to the other
 * - width height cannot exceed parent size, even when computed from aspectRatio
 *
 * Technical details
 *
 * useLayoutEffect are called from child to parent
 * https://github.com/facebook/react/issues/15281
 * But child needs parent size to be determined to position itself
 * (happens when <Box> elements are nested)
 * To solve this, we use a <LayoutEffectParentBeforeAnyChild /> rendered before any child
 * see https://gist.github.com/nikparo/33544fe0228dd5aa6f0de8d03e96c378
 *
 * This allow to call useLayoutEffect in the expected order
 * However when component is re-rendered it must re-render the children
 * so that they are all respecting the new positions&dimensions
 * To achieve this we use a state variable shouldRerender
 *
 * We could use solely shouldRerender state but that means on the first render
 * all children would need a re-render to start rendering. With the current technic
 * we got the best of both worlds where first render is immediate and subsequent renders
 * are properly re-rendering children
 */

import { useCallback, useLayoutEffect, useRef, useState } from "preact/hooks";

export const Box = ({
  name,
  elementRef = useRef(),
  visible = true,
  width,
  height,
  aspectRatio = 1,
  x = "start",
  y = "start",
  children,
  ...props
}) => {
  if (width === "auto" && height === "auto") {
    throw new Error("width and height cannot both be auto");
  }
  if (height === undefined) {
    height = "auto";
    if (width === undefined) {
      width = "100%";
    }
  } else if (width === undefined) {
    width = "auto";
  }

  const [shouldRerender, shouldRerenderSetter] = useState(false);
  const isFirstRenderRef = useRef(false);
  useLayoutEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    shouldRerenderSetter(true);
  }, [name, x, y, width, height, aspectRatio]);

  const layoutEffectCallback = useCallback(() => {
    if (!shouldRerender && !isFirstRenderRef.current) {
      return;
    }
    const div = elementRef.current;
    const offsetParent = div.offsetParent;
    let availableWidth = offsetParent.clientWidth;
    let availableHeight = offsetParent.clientHeight;
    const paddings = getPaddings(offsetParent);
    availableWidth -= paddings.left + paddings.right;
    availableHeight -= paddings.top + paddings.bottom;

    let widthComputed;
    if (typeof width === "number") {
      widthComputed = width;
    } else if (typeof width === "string" && width.endsWith("%")) {
      widthComputed = availableWidth * (parseInt(width) / 100);
    }
    let heightComputed;
    if (typeof height === "number") {
      heightComputed = height;
    } else if (typeof height === "string" && height.endsWith("%")) {
      heightComputed = availableHeight * (parseInt(height) / 100);
    }
    if (width === "auto") {
      widthComputed = heightComputed * aspectRatio;
      if (widthComputed > availableWidth) {
        // ensure cannot exceed available width
        widthComputed = availableWidth;
        heightComputed = widthComputed / aspectRatio;
      }
    }
    if (height === "auto") {
      heightComputed = widthComputed / aspectRatio;
      if (heightComputed > availableHeight) {
        // ensure cannot exceed available height
        heightComputed = availableHeight;
        widthComputed = heightComputed * aspectRatio;
      }
    }
    let xComputed;
    if (x === "start") {
      xComputed = 0;
    } else if (x === "center") {
      xComputed = (availableWidth - widthComputed) / 2;
    } else if (x === "end") {
      xComputed = availableWidth - widthComputed;
    } else if (typeof x === "number") {
      xComputed = x;
    } else if (typeof x === "string" && x.endsWith("%")) {
      xComputed = availableWidth * (parseInt(x) / 100);
    }
    xComputed += paddings.left;
    let yComputed;
    if (y === "start") {
      yComputed = 0;
    } else if (y === "center") {
      yComputed = (availableHeight - heightComputed) / 2;
    } else if (y === "end") {
      yComputed = availableHeight - heightComputed;
    } else if (typeof y === "number") {
      yComputed = y;
    } else if (typeof y === "string" && y.endsWith("%")) {
      yComputed = availableHeight * (parseInt(y) / 100);
    }
    yComputed += paddings.top;
    div.style.left = `${xComputed}px`;
    div.style.top = `${yComputed}px`;
    div.style.width = `${widthComputed}px`;
    div.style.height = `${heightComputed}px`;
    shouldRerenderSetter(false);
  }, [shouldRerender]);

  return (
    <div
      {...props}
      name={name}
      ref={elementRef}
      style={{
        ...props.style,
        position: "absolute",
        visibility: visible ? "visible" : "hidden",
      }}
    >
      <LayoutEffectParentBeforeAnyChild callback={layoutEffectCallback} />
      {shouldRerender ? null : children}
    </div>
  );
};

const LayoutEffectParentBeforeAnyChild = ({ callback, children }) => {
  useLayoutEffect(() => {
    return callback();
  }, [callback]);
  return children;
};

const getPaddings = (element) => {
  const { paddingLeft, paddingRight, paddingTop, paddingBottom } =
    window.getComputedStyle(element, null);
  return {
    left: parseFloat(paddingLeft),
    right: parseFloat(paddingRight),
    top: parseFloat(paddingTop),
    bottom: parseFloat(paddingBottom),
  };
};
