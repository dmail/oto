import { toChildArray } from "preact";

const zeroSvgUrl = import.meta.resolve("./font/numbers/0.svg");
const oneSvgUrl = import.meta.resolve("./font/numbers/1.svg");

const charUrls = {
  0: zeroSvgUrl,
  1: oneSvgUrl,
};

export const Text = ({ size = 16, color = "inherit", children }) => {
  children = toChildArray(children);

  const chars = [];
  let column = 0;
  let line = 0;
  for (const char of children[0].split("")) {
    if (char === "\n") {
      line++;
      column = 0;
      continue;
    }
    const url = charUrls[char];
    chars.push({
      id: chars.length,
      url,
      column,
      line,
    });
    column++;
  }

  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ fill: color }}>
      {chars.map(({ id, url, column, line }) => {
        if (url) {
          return (
            <use
              key={id}
              href={`${url}#layer_1`}
              x={column * size}
              y={line * size}
              width={size}
              height={size}
            />
          );
        }
        return <rect key={id} />;
      })}
    </svg>
  );
};
