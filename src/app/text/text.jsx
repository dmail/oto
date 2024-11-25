import { toChildArray } from "preact";

const goblinFontUrl = import.meta.resolve("./AGoblinAppears-o2aV.ttf");
const legendFontUrl = import.meta.resolve("./SuperLegendBoy-4w8Y.ttf");
const pixelFontUrl = import.meta.resolve("./pixel-font.ttf");

const useFontFace = ({ url, family, weight = "normal" }) => {
  return `@font-face{
        font-family: "${family}";
        src:url("${url}") format("woff");
        font-weight: ${weight};
        font-style: ${weight};
    }`;
};

export const Text = ({
  x,
  y,
  fontFamily = "goblin",
  size = 10,
  weight,
  children,
  color,
  outlineColor,
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
  for (const lineChildren of lines) {
    textChildren.push(
      <tspan x="0" dy="1.2em">
        {lineChildren}
      </tspan>,
    );
  }

  const goblinFont = useFontFace({
    url: goblinFontUrl,
    family: "goblin",
  });
  const legendFont = useFontFace({
    url: legendFontUrl,
    family: "legend",
  });
  const pixelFont = useFontFace({
    url: pixelFontUrl,
    family: "pixel",
  });

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: "absolute",
        overflow: "visible",
      }}
    >
      <defs>
        <style>
          {goblinFont}
          {legendFont}
          {pixelFont}
        </style>
      </defs>
      {outlineColor && (
        <text
          fill="none"
          x={x}
          y={y}
          font-family={fontFamily}
          font-size={size}
          font-weight={weight}
          stroke={outlineColor}
          stroke-width={4}
        >
          {textChildren}
        </text>
      )}
      <text
        fill={color}
        x={x}
        y={y}
        font-family={fontFamily}
        font-size={size}
        font-weight={weight}
      >
        {textChildren}
      </text>
    </svg>
  );
};
