import { forwardRef } from "preact/compat";
import { useImperativeHandle, useLayoutEffect, useRef } from "preact/hooks";
import { getAvailableSize } from "../../utils/get_available_size.js";
import boxStylesheet from "./box.css" with { type: "css" };
import { MultiBorder } from "./multi_border.jsx";
import { Spacing } from "./spacing.jsx";

document.adoptedStyleSheets = [...document.adoptedStyleSheets, boxStylesheet];
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
      (s) => s !== boxStylesheet,
    );
  });
}

export const borderWithStroke = ({
  color = "black",
  size = 2,
  strokeColor,
  strokeSize = 1,
  radius = 0,
  opacity,
}) => {
  return [
    {
      size: strokeSize,
      color: strokeColor,
      radius,
      opacity,
    },
    {
      size,
      color,
      radius: radius - strokeSize,
      opacity,
    },
    {
      size: strokeSize,
      color: strokeColor,
      radius: radius - strokeSize - size,
      opacity,
    },
  ];
};

export const outlinePartial = ({
  width = "10%",
  height = "10%",
  minWidth = "0.7em",
  minHeight = "0.7em",
  spacing = 0,
  size,
  color = "dodgerblue",
  opacity,
  strokeColor = "black",
  strokeSize = 1,
  radius = "0.2em",
}) => {
  return [
    {
      size,
      color,
      opacity,
      width,
      height,
      radius,
      outside: true,
      spacing,
      minWidth,
      minHeight,
      strokeSize,
      strokeColor,
    },
  ];
};

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
    ratio,
    backgroundColor,
    border,
    outline,
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
        }
      } else if (x === "center") {
        if (vertical) {
          element.style.alignSelf = "center";
        } else {
          const elementWidth = elementDimensions.width;
          const halfWidth = (availableWidth - elementWidth) / 2;
          element.style.left = `${halfWidth}px`;
        }
      } else if (x === "end") {
        if (vertical) {
          element.style.alignSelf = "flex-end";
        } else {
          element.style.left = "auto";
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

  const borders = [];
  if (outline) {
    borders.push(outline);
  }
  if (border) {
    if (Array.isArray(border)) {
      borders.push(...border);
    } else {
      borders.push(border);
    }
  }
  if (borders.length) {
    style.borderRadius = borders[0].radius;
  }
  Object.assign(style, styleForContentPosition);

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
      <MultiBorder borders={borders} backgroundColor={backgroundColor}>
        <Spacing
          around={innerSpacing}
          x={innerSpacingX}
          y={innerSpacingY}
          top={innerSpacingTop}
          bottom={innerSpacingBottom}
          left={innerSpacingLeft}
          right={innerSpacingRight}
        >
          {children}
        </Spacing>
      </MultiBorder>
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
