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
  outerSpacing,
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
  // todo: ratio should be re-updated when parent is resized
  // can be tested by increasing the game height
  // we can see the ratio becomes incorrect
  useLayoutEffect(() => {
    const element = elementRef.current;
    const offsetParent = element.parentNode;
    const { paddingSizes } = getPaddingAndBorderSizes(offsetParent);
    const { borderSizes } = getPaddingAndBorderSizes(element);
    let availableWidth = offsetParent.clientWidth;
    let availableHeight = offsetParent.clientHeight;
    availableWidth -= paddingSizes.left + paddingSizes.right;
    availableHeight -= paddingSizes.top + paddingSizes.bottom;
    if (width === "ratio" || height === "ratio") {
      if (width === "ratio") {
        const elementHeight =
          element.clientHeight + borderSizes.top + borderSizes.bottom;
        const elementWidth = elementHeight * aspectRatio;
        if (elementWidth > availableWidth) {
          element.style.width = `${availableWidth}px`;
          element.style.height = `${availableWidth / aspectRatio}px`;
        } else {
          element.style.width = `${elementWidth}px`;
        }
      }
      if (height === "ratio") {
        const elementWidth =
          element.clientWidth + borderSizes.left + borderSizes.right;
        const elementHeight = elementWidth / aspectRatio;
        if (elementHeight > availableHeight) {
          element.style.height = `${availableHeight}px`;
          element.style.width = `${availableHeight * aspectRatio}px`;
        } else {
          element.style.height = `${elementHeight}px`;
        }
      }
    }

    if (x === "start") {
      if (vertical) {
        element.style.alignSelf = "flex-start";
      } else {
        element.style.marginLeft = "0";
        element.style.marginRight = undefined;
      }
    } else if (x === "center") {
      if (vertical) {
        element.style.alignSelf = "center";
      } else {
        const elementWidth =
          element.clientWidth + borderSizes.left + borderSizes.right;
        const halfWidth = (availableWidth - elementWidth) / 2;
        element.style.marginLeft = `${halfWidth}px`;
        element.style.marginRight = `${halfWidth}px`;
      }
    } else if (x === "end") {
      if (vertical) {
        element.style.alignSelf = "flex-end";
      } else {
        element.style.marginLeft = "auto";
        element.style.marginRight = undefined;
      }
    } else if (isFinite(x)) {
      element.style.marginLeft = `${parseInt(x)}px`;
    }

    if (y === "start") {
      if (vertical) {
        element.style.marginTop = "0";
      } else {
        element.style.alignSelf = "flex-start";
      }
    } else if (y === "center") {
      if (vertical) {
        const elementHeight =
          element.clientHeight + borderSizes.top + borderSizes.bottom;
        element.style.marginTop = `${(availableHeight - elementHeight) / 2}px`;
      } else {
        element.style.alignSelf = "center";
      }
    } else if (y === "end") {
      if (vertical) {
        element.style.marginTop = "auto";
      } else {
        element.style.alignSelf = "flex-end";
      }
    } else if (isFinite(y)) {
      element.style.marginTop = `${parseInt(y)}px`;
    }
  }, [
    vertical,
    width,
    height,
    aspectRatio,
    x,
    y,
    innerSpacing,
    outerSpacingTop,
    // ...toChildArray(children),
  ]);

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
    maxHeight: isFinite(maxHeight) ? `${maxHeight}px` : maxHeight,
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
  if (outerSpacing) {
    style.margin =
      typeof outerSpacing === "number"
        ? outerSpacing
        : SPACING_SIZES[outerSpacing];
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
