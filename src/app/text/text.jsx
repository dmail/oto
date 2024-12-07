import { toChildArray } from "preact";
import { useLayoutEffect, useRef } from "preact/hooks";

export const Text = ({
  // name,
  elementRef = useRef(),
  width = "auto",
  height = "auto",
  x = "start",
  y = "start",
  dx = 0,
  dy = 0,
  fontFamily = "goblin",
  size = "0.7em",
  weight,
  children,
  color,
  outlineColor,
  letterSpacing,
  lineHeight = 1.4,
  visible = true,
  ...props
}) => {
  const defaultSize = 10;

  children = toChildArray(children);
  const lines = [];
  let currentLineChildren = [];
  for (const child of children) {
    if (typeof child === "string") {
      for (const char of child.split("")) {
        if (char === "\n") {
          lines.push(currentLineChildren);
          currentLineChildren = [];
          continue;
        }
        currentLineChildren.push(char);
      }
    } else if (child.type === "br") {
      lines.push(currentLineChildren);
      currentLineChildren = [];
    } else {
      currentLineChildren.push(child);
    }
  }
  if (currentLineChildren.length) {
    lines.push(currentLineChildren);
  }
  const textChildren = [];
  let lineIndex = 0;
  const tspanAttributes = {};
  if (x === "start") {
    tspanAttributes["text-anchor"] = "start";
    tspanAttributes.x = "0";
  } else if (x === "center") {
    tspanAttributes["text-anchor"] = "middle";
    tspanAttributes.x = "50%";
  } else if (x === "end") {
    tspanAttributes["text-anchor"] = "end";
    tspanAttributes.x = "100%";
  }

  if (y === "start") {
    tspanAttributes.y = "0";
  } else if (y === "center") {
    tspanAttributes.y = "50%";
    dy -= 0.5 * defaultSize;
  } else if (y === "end") {
    tspanAttributes.y = "100%";
    dy -= defaultSize;
  }
  for (const lineChildren of lines) {
    textChildren.push(
      <tspan
        {...tspanAttributes}
        dx={dx}
        dy={dy + lineHeight * defaultSize * lineIndex}
      >
        {lineChildren}
      </tspan>,
    );
    lineIndex++;
  }

  const textRef = useRef();

  const thickness = weight === "bold" ? 1 : 0;
  if (weight === "bold") {
    letterSpacing += thickness;
  }

  useLayoutEffect(() => {
    if (width === "auto" || height === "auto") {
      const svg = elementRef.current;
      const textBBox = textRef.current.getBBox();
      if (width === "auto") {
        svg.style.width = `${textBBox.width}px`;
      }
      if (height === "auto") {
        svg.style.height = `${textBBox.height}px`;
      }
    }
  }, [
    width,
    height,
    outlineColor,
    letterSpacing,
    lineHeight,
    size,
    ...toChildArray(children),
  ]);

  return (
    <svg
      {...props}
      ref={elementRef}
      xmlns="http://www.w3.org/2000/svg"
      style={{
        ...props.style,
        // width: width === "100%" ? width : undefined,
        // height: height === "100%" ? height : undefined,
        display: "block",
        visibility: visible ? "visible" : "hidden",
        pointerEvents: visible ? "auto" : "none",
        dominantBaseline: "text-before-edge",
        overflow: "visible",
        fontSize: size,
        fontFamily,
      }}
    >
      {outlineColor && (
        <text
          fill="none"
          font-family={fontFamily}
          stroke={outlineColor}
          stroke-width={thickness + 3}
          letter-spacing={letterSpacing}
        >
          {textChildren}
        </text>
      )}
      <text
        ref={textRef}
        fill={color}
        stroke={color}
        stroke-width={thickness}
        letter-spacing={letterSpacing}
      >
        {textChildren}
      </text>
    </svg>
  );
};
