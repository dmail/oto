import { useLayoutEffect, useRef } from "preact/hooks";

export const Box = ({
  name,
  elementRef = useRef(),
  vertical = false,
  children,
  innerSpacing,
  innerSpacingTop,
  innerSpacingLeft,
  innerSpacingRight,
  innerSpacingBottom,
  outerSpacingTop,
  width = vertical ? "100%" : "auto",
  height = vertical ? "auto" : "100%",
  maxWidth,
  maxHeight,
  aspectRatio = 1,
  x = "start",
  y = "start",
  ...props
}) => {
  useLayoutEffect(() => {
    if (width !== "auto" && height !== "auto") {
      return;
    }
    const element = elementRef.current;
    const offsetParent = element.offsetParent;
    const { paddingSizes } = getPaddingAndBorderSizes(offsetParent);
    const { borderSizes } = getPaddingAndBorderSizes(element);
    let availableWidth = offsetParent.clientWidth;
    let availableHeight = offsetParent.clientHeight;
    availableWidth -= paddingSizes.left + paddingSizes.right;
    availableHeight -= paddingSizes.top + paddingSizes.bottom;
    if (height === "auto") {
      const width = element.clientWidth + borderSizes.left + borderSizes.right;
      const height = width / aspectRatio;
      if (height > availableHeight) {
        element.style.height = `${availableHeight}px`;
        element.style.width = `${availableHeight * aspectRatio}px`;
      } else {
        element.style.height = `${height}px`;
      }
    }
    if (width === "auto") {
      const height =
        element.clientHeight + borderSizes.top + borderSizes.bottom;
      const width = height * aspectRatio;
      if (width > availableWidth) {
        element.style.width = `${availableWidth}px`;
        element.style.height = `${availableWidth / aspectRatio}px`;
      } else {
        element.style.width = `${width}px`;
      }
    }
  }, [width, height, aspectRatio, innerSpacing, outerSpacingTop]);

  const style = {
    ...props.style,
    display: "inline-flex",
    flexDirection: vertical ? "column" : "row",
    position: "relative",
    width: isFinite(width) ? `${width}px` : width === "..." ? undefined : width,
    height: isFinite(height)
      ? `${height}px`
      : height === "..."
        ? undefined
        : height,
    maxWidth,
    maxHeight,
    flexWrap: "wrap",
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
  if (outerSpacingTop) {
    style.marginTop =
      typeof outerSpacingTop === "number"
        ? outerSpacingTop
        : SPACING_SIZES[outerSpacingTop];
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
  if (x === "start") {
    style.marginRight = "auto";
  } else if (x === "center") {
    style.marginLeft = "auto";
    style.marginRight = "auto";
  } else if (x === "end") {
    style.marginLeft = "auto";
  }

  if (y === "start") {
    style.marginBottom = "auto";
  } else if (y === "center") {
    style.marginTop = "auto";
    style.marginBottom = "auto";
  } else if (y === "end") {
    style.marginTop = "auto";
  }
  return (
    <div {...props} ref={elementRef} name={name} style={style}>
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

const getPaddingAndBorderSizes = (element) => {
  const {
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    borderLeftWidth,
    borderRightWidth,
    borderTopWidth,
    borderBottomWidth,
  } = window.getComputedStyle(element, null);
  return {
    paddingSizes: {
      left: parseFloat(paddingLeft),
      right: parseFloat(paddingRight),
      top: parseFloat(paddingTop),
      bottom: parseFloat(paddingBottom),
    },
    borderSizes: {
      left: parseFloat(borderLeftWidth),
      right: parseFloat(borderRightWidth),
      top: parseFloat(borderTopWidth),
      bottom: parseFloat(borderBottomWidth),
    },
  };
};
