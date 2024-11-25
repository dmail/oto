import { toChildArray } from "preact";
import { useLayoutEffect, useRef } from "preact/hooks";

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
  for (const lineChildren of lines) {
    textChildren.push(
      <tspan x="0" dy={lineIndex === 0 ? "0" : "1.2em"}>
        {lineChildren}
      </tspan>,
    );
    lineIndex++;
  }

  const textRef = useRef();

  useLayoutEffect(() => {
    const svgRef = elementRef.current;
    const text = textRef.current;
    const textBBox = text.getBBox();

    let left;
    let marginLeft;
    if (x === "center") {
      left = "50%";
      marginLeft = dx - textBBox.width / 2;
    } else if (x === "start") {
      left = 0;
      marginLeft = dx;
    } else if (x === "end") {
      left = "100%";
      marginLeft = dx;
    } else {
      left = x ? `${x}px` : 0;
      marginLeft = dx;
    }
    svgRef.style.left = left;
    svgRef.style.marginLeft = `${marginLeft}px`;

    let top;
    let marginTop;
    if (y === "center") {
      top = "50%";
      marginTop = dy - textBBox.height / 2;
    } else if (y === "start") {
      top = 0;
      marginTop = dy;
    } else if (y === "end") {
      top = `100%`;
      marginTop = dy;
    } else {
      top = y ? `${y}px` : 0;
      marginTop = dy;
    }
    svgRef.style.top = top;
    svgRef.style.marginTop = `${marginTop}px`;
  }, [x, dx, y, dy]);

  const thickness = weight === "bold" ? 1 : 0;
  if (weight === "bold") {
    letterSpacing += thickness;
  }

  return (
    <svg
      ref={elementRef}
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: "absolute",
        overflow: "visible",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
      }}
    >
      {outlineColor && (
        <text
          fill="none"
          font-family={fontFamily}
          font-size={size}
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
        font-family={fontFamily}
        font-size={size}
        stroke={color}
        stroke-width={thickness}
        letter-spacing={letterSpacing}
      >
        {textChildren}
      </text>
    </svg>
  );
};
