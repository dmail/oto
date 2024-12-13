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
    fontWeight,
    children,
    color,
    outlineColor,
    letterSpacing,
    lineHeight = 1.4,
    visible = true,
    ...props
  },
  ref,
) => {
  const lines = splitLines(children);
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

  const thickness = fontWeight === "bold" ? 1 : 0;

  if (y === "start") {
    tspanAttributes.y = "0";
  } else if (y === "center") {
    tspanAttributes.y = "50%";
    dy -= 0.5 * fontSizeBase;
  } else if (y === "end") {
    tspanAttributes.y = "100%";
    dy -= fontSizeBase;
  }
  for (const line of lines) {
    const lineAttributes = {
      ...tspanAttributes,
      dx,
      dy: dy + lineHeight * fontSizeBase * lineIndex,
    };
    const lineChildren = [];
    for (const part of line) {
      if (typeof part === "string") {
        lineChildren.push(part);
      } else {
        lineChildren.push(<Tspan {...part}></Tspan>);
      }
    }
    textChildren.push(
      <Tspan
        {...lineAttributes}
        fontSize={fontSize}
        fontFamily={fontFamily}
        fontWeight={fontWeight}
        letterSpacing={letterSpacing}
      >
        {lineChildren}
      </Tspan>,
    );
    lineIndex++;
  }

  const textRef = useRef();
  const textOutlineRef = useRef();

  // TODO: should be resizeObserver too
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
        position:
          width === "auto" || height === "auto" ? "absolute" : "relative",
      }}
    >
      {outlineColor && (
        <text
          ref={textOutlineRef}
          fill="none"
          stroke={outlineColor}
          stroke-width={thickness + 3}
        >
          {textChildren}
        </text>
      )}
      <text ref={textRef} fill={color} stroke={color} stroke-width={thickness}>
        {textChildren}
      </text>
    </svg>
  );
};

const Tspan = ({
  fontSize,
  fontFamily,
  fontWeight,
  letterSpacing,
  children,
}) => {
  return (
    <tspan
      font-size={isFinite(fontSize) ? `${parseInt(fontSize)}px` : fontSize}
      font-family={fontFamily}
      font-weight={fontWeight}
      letter-spacing={letterSpacing}
    >
      {children}
    </tspan>
  );
};

export const Text = forwardRef(TextComponent);

Text.bold = ({ children }) => {
  return <Text weight="bold">{children}</Text>;
};

export const splitLines = (text) => {
  const lines = [];
  let line = [];
  const visitChildren = (children) => {
    if (children === null) {
      return;
    }
    if (typeof children === "number") {
      children = String(children).split("");
    }
    if (typeof children === "string") {
      children = children.split("");
    }
    for (const child of children) {
      if (typeof child === "string") {
        const [firstLine, ...remainingLines] = child.split("\n");
        line.push(firstLine);
        if (remainingLines.length) {
          lines.push(line);
          lines.push(remainingLines);
          line = [];
        }
      } else if (child.type === "br") {
        lines.push(line);
        line = [];
      } else if (child.type.displayName.includes("TextComponent")) {
        const { props } = child;
        const { fontWeight, children } = props;
        line.push({ fontWeight, children });
      } else {
        line.push(child);
      }
    }
  };
  visitChildren(text);
  if (line.length) {
    lines.push(line);
  }
  return lines;
};
