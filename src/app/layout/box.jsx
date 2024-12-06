import { useLayoutEffect, useRef } from "preact/hooks";

export const Box = ({
  elementRef = useRef(),
  vertical = false,
  children,
  innerSpacing,
  innerSpacingTop,
  innerSpacingLeft,
  innerSpacingRight,
  innerSpacingBottom,
  width = vertical ? "100%" : "auto",
  height = vertical ? "fit-content" : "100%",
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
    flexDirection: vertical ? "row" : "column",
    position: "relative",
    width: isFinite(width) ? `${width}px` : width === "..." ? undefined : width,
    height: isFinite(height) ? `${height}px` : height,
    flexWrap: "wrap",
    minWidth: height === "..." ? 0 : undefined,
    minHeight: width === "..." ? 0 : undefined,
  };
  if (innerSpacing) {
    style.padding =
      typeof innerSpacing === "number"
        ? innerSpacing
        : SPACING_SIZES[innerSpacing];
  }
  if (innerSpacingTop) {
    style.innerSpacingTop =
      typeof innerSpacingTop === "number"
        ? innerSpacingTop
        : SPACING_SIZES[innerSpacingTop];
  }
  if (innerSpacingLeft) {
    style.paddingLeft =
      typeof innerSpacingLeft === "number"
        ? innerSpacingLeft
        : SPACING_SIZES[innerSpacingLeft];
  }
  if (innerSpacingRight) {
    style.paddingRight =
      typeof innerSpacingRight === "number"
        ? innerSpacingRight
        : SPACING_SIZES[innerSpacingRight];
  }
  if (innerSpacingBottom) {
    style.paddingBottom =
      typeof innerSpacingBottom === "number"
        ? innerSpacingBottom
        : SPACING_SIZES[innerSpacingBottom];
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
