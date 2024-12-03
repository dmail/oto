import { useLayoutEffect, useRef, useState } from "preact/hooks";

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

  const [shouldCompute, shouldComputeSetter] = useState(true);
  useLayoutEffect(() => {
    shouldComputeSetter(true);
  }, [name, x, y, width, height, aspectRatio]);
  useLayoutEffect(() => {
    if (!shouldCompute) {
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
    shouldComputeSetter(false);
  }, [shouldCompute]);

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
      {shouldCompute ? null : children}
    </div>
  );
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
