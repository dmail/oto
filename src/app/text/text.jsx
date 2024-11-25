import { toChildArray } from "preact";

import { A } from "./font/letters/a.jsx";
import { Zero } from "./font/numbers/0.jsx";
import { One } from "./font/numbers/1.jsx";

const charComponents = {
  0: Zero,
  1: One,
  A,
};

const outlineSizes = {
  md: 100,
};
const weightSizes = {
  md: 50,
  lg: 100,
};

export const Text = ({
  size = 16,
  color = "inherit",
  weight = "md",
  outlineColor,
  outlineSize = "md",
  letterSpacing = 0,
  children,
}) => {
  children = toChildArray(children);

  let column = 0;
  let line = 0;
  const finalChildren = [];
  const strokeWidth = weightSizes[weight];
  outlineSize = strokeWidth + outlineSizes[outlineSize];
  for (const child of children) {
    if (typeof child === "string") {
      for (const char of child.split("")) {
        if (char === "\n") {
          line++;
          column = 0;
          continue;
        }
        const CharComponent = charComponents[char];
        if (CharComponent) {
          finalChildren.push(
            <CharComponent
              key={finalChildren.length}
              x={column === 0 ? 0 : column * size + letterSpacing}
              y={line * size}
              width={size}
              height={size}
              strokeWidth={strokeWidth}
              outlineColor={outlineColor}
              outlineSize={outlineSize}
            />,
          );
        } else {
          finalChildren.push(<rect key={finalChildren.length} />);
        }
        column++;
      }
    } else {
      debugger;
      finalChildren.push(child);
    }
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: "absolute",
        overflow: "visible",
        fill: color,
      }}
    >
      {finalChildren}
    </svg>
  );
};
