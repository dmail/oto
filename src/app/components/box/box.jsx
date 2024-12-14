import { forwardRef } from "preact/compat";
import { useImperativeHandle, useLayoutEffect, useRef } from "preact/hooks";
import { getAvailableSize } from "../../utils/get_available_size.js";
import boxStylesheet from "./box.css" with { type: "css" };
import { MultiBorder } from "./multi_border.jsx";

document.adoptedStyleSheets = [...document.adoptedStyleSheets, boxStylesheet];
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
      (s) => s !== boxStylesheet,
    );
  });
}

const BoxComponent = (
  {
    NodeName = "div",
    name,
    vertical = false,
    absolute = false,
    hidden = false,
    invisible = false,
    children,
    innerSpacing = 0,
    innerSpacingY,
    innerSpacingX,
    innerSpacingTop,
    innerSpacingLeft,
    innerSpacingRight,
    innerSpacingBottom,
    outerSpacing,
    outerSpacingTop,
    ratio,
    borderColor,
    borderSize = 0,
    borderOutlineColor,
    borderOutlineSize = 0,
    borderRadius,
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
  },
  ref,
) => {
  const innerRef = useRef();
  useImperativeHandle(ref, () => innerRef.current);

  useLayoutEffect(() => {
    const element = innerRef.current;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      // const { borderSizes } = getPaddingAndBorderSizes(element);
      const elementDimensions = element.getBoundingClientRect();
      const [availableWidth, availableHeight] = getAvailableSize(
        element.parentNode,
      );

      if (x === "start") {
        if (vertical) {
          element.style.alignSelf = "flex-start";
        } else {
          element.style.left = "0";
          // element.style.right = undefined;
        }
      } else if (x === "center") {
        if (vertical) {
          element.style.alignSelf = "center";
        } else {
          const elementWidth = elementDimensions.width;
          const halfWidth = (availableWidth - elementWidth) / 2;
          // Math.floor is important otherwise the float imprecision
          // might cause element to resize due to margings, then
          // be resized again due to the new widht infinite loop of resizing
          element.style.left = `${halfWidth}px`;
          // element.style.right = `${halfWidth}px`;
        }
      } else if (x === "end") {
        if (vertical) {
          element.style.alignSelf = "flex-end";
        } else {
          element.style.left = "auto";
          // element.style.right = undefined;
        }
      } else if (isFinite(x)) {
        element.style.left = `${parseInt(x)}px`;
      }

      if (y === "start") {
        if (vertical) {
          element.style.top = "0";
        } else {
          element.style.alignSelf = "flex-start";
        }
      } else if (y === "center") {
        if (vertical) {
          const elementHeight = elementDimensions.height;
          element.style.top = `${(availableHeight - elementHeight) / 2}px`;
        } else {
          element.style.alignSelf = "center";
        }
      } else if (y === "end") {
        if (vertical) {
          element.style.top = "auto";
        } else {
          element.style.alignSelf = "flex-end";
        }
      } else if (isFinite(y)) {
        element.style.top = `${parseInt(y)}px`;
      }
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [x, y, vertical]);

  const style = {
    position: absolute ? "absolute" : "relative",
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
    cursor,
    ...props.style,
  };
  if (innerSpacing !== undefined) {
    style.padding = isFinite(innerSpacing)
      ? parseInt(innerSpacing)
      : SPACING_SIZES[innerSpacing] || innerSpacing;
  }
  if (innerSpacingY) {
    style.paddingTop = style.paddingBottom = isFinite(innerSpacingY)
      ? parseInt(innerSpacingY)
      : SPACING_SIZES[innerSpacingY] || innerSpacingY;
  }
  if (innerSpacingX) {
    style.paddingLeft = style.paddingRight = isFinite(innerSpacingX)
      ? parseInt(innerSpacingX)
      : SPACING_SIZES[innerSpacingX] || innerSpacingX;
  }
  if (innerSpacingTop) {
    style.paddingTop = isFinite(innerSpacingTop)
      ? parseInt(innerSpacingTop)
      : SPACING_SIZES[innerSpacingTop] || innerSpacingTop;
  }
  if (innerSpacingLeft) {
    style.paddingLeft = isFinite(innerSpacingLeft)
      ? parseInt(innerSpacingLeft)
      : SPACING_SIZES[innerSpacingLeft] || innerSpacingLeft;
  }
  if (innerSpacingRight) {
    style.paddingRight = isFinite(innerSpacingRight)
      ? parseInt(innerSpacingRight)
      : SPACING_SIZES[innerSpacingRight] || innerSpacingRight;
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

  const styleForContentPosition = {};
  if (contentX === "start") {
    if (vertical) {
      styleForContentPosition.alignItems = "flex-start";
    } else {
      styleForContentPosition.justifyContent = "flex-start";
    }
  } else if (contentX === "center") {
    if (vertical) {
      styleForContentPosition.alignItems = "center";
    } else {
      styleForContentPosition.justifyContent = "center";
    }
  } else if (contentX === "end") {
    if (vertical) {
      styleForContentPosition.alignItems = "flex-end";
    } else {
      styleForContentPosition.justifyContent = "flex-end";
    }
  }
  if (contentY === "start") {
    if (vertical) {
      styleForContentPosition.justifyContent = "flex-start";
    } else {
      styleForContentPosition.alignItems = "flex-start";
    }
  } else if (contentY === "center") {
    if (vertical) {
      styleForContentPosition.justifyContent = "center";
    } else {
      styleForContentPosition.alignItems = "center";
    }
  } else if (contentY === "end") {
    if (vertical) {
      styleForContentPosition.justifyContent = "flex-end";
    } else {
      styleForContentPosition.alignItems = "flex-end";
    }
  }
  const needsSpacingContainer = Boolean(
    innerSpacing ||
      innerSpacingX ||
      innerSpacingY ||
      innerSpacingBottom ||
      innerSpacingTop ||
      innerSpacingLeft,
  );
  if (!needsSpacingContainer) {
    Object.assign(style, styleForContentPosition);
  }

  const borders = borderOutlineSize
    ? [
        {
          size: borderOutlineSize,
          color: borderOutlineColor,
          radius: borderRadius,
        },
        {
          size: borderSize,
          color: borderColor,
          radius: borderRadius,
        },
        {
          size: borderOutlineSize,
          color: borderOutlineColor,
          radius: borderRadius,
        },
      ]
    : [];

  if (borders.length) {
    let fullSize = borders.reduce((acc, border) => acc + border.size, 0);
    style.borderWidth = `${fullSize}px`;
    style.borderStyle = "solid";
    style.borderColor = "transparent";
  }

  return (
    <NodeName
      ref={innerRef}
      name={name}
      className="box"
      {...props}
      data-vertical={vertical || undefined}
      data-hidden={hidden || undefined}
      data-invisible={invisible || undefined}
      style={style}
    >
      {borders.length > 0 && <MultiBorder borders={borders} />}

      {/*
       * This wrapper div ensure children takes dimension - padding into account when
       * they positions and dimensions themselves
       */}
      {needsSpacingContainer ? (
        <div
          name="spacing_container"
          style={{
            ...styleForContentPosition,
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

export const Box = forwardRef(BoxComponent);

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
