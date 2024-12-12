import { toChildArray } from "preact";
import { useLayoutEffect, useRef } from "preact/hooks";
import boxStylesheet from "./box.css" with { type: "css" };

document.adoptedStyleSheets = [...document.adoptedStyleSheets, boxStylesheet];
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
      (s) => s !== boxStylesheet,
    );
  });
}

export const Box = ({
  NodeName = "div",
  name,
  elementRef = useRef(),
  vertical = false,
  absolute = false,
  hidden = false,
  invisible = false,
  children,
  innerSpacing = 0,
  innerSpacingTop,
  innerSpacingLeft,
  innerSpacingRight,
  innerSpacingBottom,
  outerSpacing,
  outerSpacingTop,
  ratio,
  border,
  width = "auto",
  height = "auto",
  maxWidth = ratio && height !== "auto" ? "100%" : undefined,
  maxHeight = ratio && width !== "auto" ? "100%" : undefined,
  x = "start",
  y = "start",
  contentX = "start",
  contentY = "start",
  cursor,
  ...props
}) => {
  useLayoutEffect(() => {
    const element = elementRef.current;
    const offsetParent = element.parentNode;
    const { paddingSizes } = getPaddingAndBorderSizes(offsetParent);
    const { borderSizes } = getPaddingAndBorderSizes(element);
    let availableWidth = offsetParent.clientWidth;
    let availableHeight = offsetParent.clientHeight;
    availableWidth -= paddingSizes.left + paddingSizes.right;
    availableHeight -= paddingSizes.top + paddingSizes.bottom;

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
    x,
    y,
    vertical,
    width,
    height,
    ratio,
    maxWidth,
    maxHeight,
    innerSpacing,
    outerSpacingTop,
    ...toChildArray(children),
  ]);

  const style = {
    width: isFinite(width)
      ? `${width}px`
      : width === "..." || width === "auto"
        ? undefined
        : width,
    height: isFinite(height)
      ? `${height}px`
      : height === "..." || height === "auto"
        ? undefined
        : height,
    maxWidth: isFinite(maxWidth) ? `${maxWidth}px` : maxWidth,
    maxHeight: isFinite(maxHeight) ? `${maxHeight}px` : maxHeight,
    border,
    cursor,
    ...props.style,
  };
  if (absolute) {
    style.position = "absolute";
  }
  if (innerSpacing !== undefined) {
    style.padding = isFinite(innerSpacing)
      ? parseInt(innerSpacing)
      : SPACING_SIZES[innerSpacing] || innerSpacing;
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
    style.paddingBottom = isFinite(innerSpacingBottom)
      ? parseInt(innerSpacingBottom)
      : SPACING_SIZES[innerSpacingBottom] || innerSpacingBottom;
  }
  if (outerSpacing) {
    style.margin = isFinite(outerSpacing)
      ? parseInt(outerSpacing)
      : SPACING_SIZES[outerSpacing] || outerSpacing;
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
  if (ratio) {
    style.aspectRatio = ratio;
  }
  if (contentX === "start") {
    if (vertical) {
      style.alignItems = "flex-start";
    } else {
      style.justifyContent = "flex-start";
    }
  } else if (contentX === "center") {
    if (vertical) {
      style.alignItems = "center";
    } else {
      style.justifyContent = "center";
    }
  } else if (contentX === "end") {
    if (vertical) {
      style.alignItems = "flex-end";
    } else {
      style.justifyContent = "flex-end";
    }
  }
  if (contentY === "start") {
    if (vertical) {
      style.justifyContent = "flex-start";
    } else {
      style.alignItems = "flex-start";
    }
  } else if (contentY === "center") {
    if (vertical) {
      style.justifyContent = "center";
    } else {
      style.alignItems = "center";
    }
  } else if (contentY === "end") {
    if (vertical) {
      style.justifyContent = "flex-end";
    } else {
      style.alignItems = "flex-end";
    }
  }

  return (
    <NodeName
      name={name}
      {...props}
      className="box"
      data-vertical={vertical || undefined}
      data-hidden={hidden || undefined}
      data-invisible={invisible || undefined}
      ref={elementRef}
      style={style}
    >
      {/*
       * This wrapper div ensure children takes dimension - padding into account when
       * they positions and dimensions themselves
       */}
      {innerSpacing ? (
        <div
          name="spacing_container"
          style={{
            display: "inline-flex",
            width: "100%",
            height: "100%",
            position: "relative",
          }}
        >
          {children}
        </div>
      ) : (
        children
      )}
    </NodeName>
  );
};

Box.div = (props) => {
  return <Box NodeName="div" {...props} />;
};
Box.canvas = (props) => {
  return <Box NodeName="canvas" {...props} />;
};
Box.button = (props) => {
  return <Box NodeName="button" {...props} />;
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
