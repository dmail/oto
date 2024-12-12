import { render, toChildArray } from "preact";
import { forwardRef } from "preact/compat";
import { useImperativeHandle, useLayoutEffect, useRef } from "preact/hooks";
import { splitLines } from "./text_utils.js";

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
  const lines = splitLines(children, maxLines);
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

export const measureText = (
  text,
  { fontFamily = "goblin", fontSize = "0.7em" } = {},
) => {
  const div = document.createElement("div");
  render(
    <Text fontFamily={fontFamily} fontSize={fontSize}>
      {text}
    </Text>,
    div,
  );
  const svg = div.querySelector("svg");
  debugger;
  const { width, height } = svg.getBBox();
  return [width, height];
};
