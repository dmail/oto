import { toChildArray } from "preact";
import { forwardRef } from "preact/compat";
import { useImperativeHandle, useLayoutEffect, useRef } from "preact/hooks";

const TextComponent = (
  {
    // name,
    width = "auto",
    height = "auto",
    x = "start",
    y = "start",
    dx = 0,
    dy = 0,
    fontFamily = "goblin",
    fontSize = "0.7em",
    weight,
    children,
    color,
    outlineColor,
    letterSpacing,
    lineHeight = 1.4,
    maxLines,
    visible = true,
    ...props
  },
  ref,
) => {
  const lines = splitLines(children, maxLines);
  const innerRef = useRef();
  useImperativeHandle(ref, () => innerRef.current);

  const fontSizeBase = 10;
  children = toChildArray(children);

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
    dy -= 0.5 * fontSizeBase;
  } else if (y === "end") {
    tspanAttributes.y = "100%";
    dy -= fontSizeBase;
  }
  for (const lineChildren of lines) {
    textChildren.push(
      <tspan
        {...tspanAttributes}
        dx={dx}
        dy={dy + lineHeight * fontSizeBase * lineIndex}
      >
        {lineChildren}
      </tspan>,
    );
    lineIndex++;
  }

  const textRef = useRef();
  const textOutlineRef = useRef();

  const thickness = weight === "bold" ? 1 : 0;
  if (weight === "bold") {
    letterSpacing += thickness;
  }

  useLayoutEffect(() => {
    if (width === "auto" || height === "auto") {
      const svg = innerRef.current;
      const textOutline = textOutlineRef.current;
      const text = textRef.current;
      const textBBox = textOutline
        ? textOutline.getBBox({ stroke: true })
        : text.getBBox();
      if (width === "auto") {
        svg.style.width = `${textBBox.width}px`;
      }
      if (height === "auto") {
        svg.style.height = `${textBBox.height}px`;
      }
      svg.style.position = "";
    }
  }, [
    width,
    height,
    outlineColor,
    letterSpacing,
    lineHeight,
    fontSize,
    ...toChildArray(children),
  ]);

  return (
    <svg
      {...props}
      ref={innerRef}
      xmlns="http://www.w3.org/2000/svg"
      style={{
        ...props.style,
        // width: width === "100%" ? width : undefined,
        // height: height === "100%" ? height : undefined,
        display: "block",
        pointerEvents: visible ? "auto" : "none",
        dominantBaseline: "text-before-edge",
        overflow: "visible",
        fontSize: isFinite(fontSize) ? `${parseInt(fontSize)}px` : fontSize,
        fontFamily,
        position:
          width === "auto" || height === "auto" ? "absolute" : "relative",
      }}
    >
      {outlineColor && (
        <text
          ref={textOutlineRef}
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

export const Text = forwardRef(TextComponent);

export const splitLines = (text, maxLines) => {
  const lines = [];
  let currentLineChildren = [];
  let someChildNotAString = false;
  if (text === null) {
    return [];
  }
  if (typeof text === "number") {
    text = String(text).split("");
  }
  if (typeof text === "string") {
    text = text.split("");
  }
  for (const child of text) {
    if (typeof child === "string") {
      for (const char of child.split("")) {
        if (char === "\n") {
          lines.push(currentLineChildren);
          currentLineChildren = [];
          someChildNotAString = false;
          continue;
        }
        currentLineChildren.push(char);
      }
    } else if (child.type === "br") {
      lines.push(currentLineChildren);
      currentLineChildren = [];
      someChildNotAString = true;
    } else {
      currentLineChildren.push(child);
      someChildNotAString = true;
    }
    if (maxLines && lines.length >= maxLines) {
      break;
    }
  }
  if (currentLineChildren.length && (!maxLines || lines.length < maxLines)) {
    if (someChildNotAString) {
      lines.push(currentLineChildren);
    } else {
      lines.push(currentLineChildren.join(""));
    }
  }
  return lines;
};
