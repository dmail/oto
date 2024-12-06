import { useLayoutEffect, useRef } from "preact/hooks";

export const Box = ({
  elementRef = useRef(),
  rows = false,
  children,
  spacing,
  spacingTop,
  spacingLeft,
  spacingRight,
  spacingBottom,
  width = rows ? "100%" : "auto",
  height = rows ? "fit-content" : "100%",
  aspectRatio = 1,
  x = "start",
  y = "start",
  ...props
}) => {
  useLayoutEffect(() => {
    const element = elementRef.current;
    if (height === "auto") {
      const width = height * aspectRatio;
      element.style.width = `${width}px`;
    }
    if (width === "auto") {
      const height = width / aspectRatio;
      element.style.height = `${height}px`;
    }
  }, [width, height, aspectRatio]);

  const style = {
    ...props.style,
    display: "inline-flex",
    flexDirection: rows ? "row" : "column",
    position: "relative",
    width: isFinite(width) ? `${width}px` : width === "..." ? undefined : width,
    height: isFinite(height) ? `${height}px` : height,
    flexWrap: "wrap",
    minWidth: height === "..." ? 0 : undefined,
    minHeight: width === "..." ? 0 : undefined,
  };
  if (spacing) {
    style.padding =
      typeof spacing === "number" ? spacing : SPACING_SIZES[spacing];
  }
  if (spacingTop) {
    style.paddingTop =
      typeof spacingTop === "number" ? spacingTop : SPACING_SIZES[spacingTop];
  }
  if (spacingLeft) {
    style.paddingLeft =
      typeof spacingLeft === "number"
        ? spacingLeft
        : SPACING_SIZES[spacingLeft];
  }
  if (spacingRight) {
    style.paddingRight =
      typeof spacingRight === "number"
        ? spacingRight
        : SPACING_SIZES[spacingRight];
  }
  if (spacingBottom) {
    style.paddingBottom =
      typeof spacingBottom === "number"
        ? spacingBottom
        : SPACING_SIZES[spacingBottom];
  }
  if (height === "..." || width === "...") {
    style.minWidth = 0;
    style.minHeight = 0;
    style.flexGrow = 1;
  }
  style.alignSelf = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
  }[y];
  if (x === "center") {
    style.marginLeft = "auto";
    style.marginRight = "auto";
  }
  if (y === "center") {
    style.marginTop = "auto";
    style.marginBottom = "auto";
  }
  return (
    <div {...props} ref={elementRef} style={style}>
      {children}
    </div>
  );
};

const SPACING_SIZES = {
  xxl: 100,
  xl: 50,
  l: 20,
  md: 10,
  s: 5,
  xs: 2,
  xxs: 1,
};
