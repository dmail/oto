import { toChildArray } from "preact";
import { useRef } from "preact/hooks";

export const Text = ({
  elementRef = useRef(),
  x,
  y,
  dx = 0,
  dy = 0,
  fontFamily = "goblin",
  size = 10,
  weight,
  children,
  color,
  outlineColor,
  letterSpacing,
  lineHeight = 1.4,
}) => {
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
    dy -= 0.5 * size;
  } else if (y === "end") {
    tspanAttributes.y = "100%";
    dy -= size;
  }
  for (const lineChildren of lines) {
    textChildren.push(
      <tspan
        {...tspanAttributes}
        dx={dx}
        dy={dy + lineHeight * size * lineIndex}
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

  return (
    <svg
      ref={elementRef}
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      style={{
        dominantBaseline: "central",
        position: "absolute",
        overflow: "visible",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
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
          // eslint-disable-next-line react/no-unknown-property
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
        // eslint-disable-next-line react/no-unknown-property
        letter-spacing={letterSpacing}
      >
        {textChildren}
      </text>
    </svg>
  );
};
