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

// export const Text = ({
//   size = 16,
//   color = "inherit",
//   weight = "md",
//   outlineColor,
//   outlineSize = "md",
//   letterSpacing = 0,
//   children,
// }) => {
//   children = toChildArray(children);

//   let column = 0;
//   let line = 0;
//   const finalChildren = [];
//   const strokeWidth = weightSizes[weight];
//   outlineSize = strokeWidth + outlineSizes[outlineSize];
//   for (const child of children) {
//     if (typeof child === "string") {
//       for (const char of child.split("")) {
//         if (char === "\n") {
//           line++;
//           column = 0;
//           continue;
//         }
//         const CharComponent = charComponents[char];
//         if (CharComponent) {
//           finalChildren.push(
//             <CharComponent
//               key={finalChildren.length}
//               x={column === 0 ? 0 : column * size + letterSpacing}
//               y={line * size}
//               width={size}
//               height={size}
//               strokeWidth={strokeWidth}
//               outlineColor={outlineColor}
//               outlineSize={outlineSize}
//             />,
//           );
//         } else {
//           finalChildren.push(<rect key={finalChildren.length} />);
//         }
//         column++;
//       }
//     } else {
//       debugger;
//       finalChildren.push(child);
//     }
//   }

//   return (
//     <svg
//       xmlns="http://www.w3.org/2000/svg"
//       style={{
//         position: "absolute",
//         overflow: "visible",
//         fill: color,
//       }}
//     >
//       {finalChildren}
//     </svg>
//   );
// };
