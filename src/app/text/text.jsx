import { render } from "preact";
import { forwardRef } from "preact/compat";
import { useImperativeHandle, useLayoutEffect, useRef } from "preact/hooks";
import { getAvailableSize } from "/app/utils/get_available_size.js";

const TextComponent = (
  {
    // name,
    width = "auto",
    height = "auto",
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
  useLayoutEffect(() => {
    const svg = innerRef.current;
    const [availableWidth, availableHeight] = getAvailableSize(svg.parentNode);
    const textFiller = createTextFiller(lines, {
      dx,
      dy,
      fontSize,
      fontFamily,
      fontWeight,
      letterSpacing,
      lineHeight,
      svgElement: svg,
      availableWidth,
      availableHeight,
      color,
      outlineColor,
    });
    textFiller();
  }, [lines]);

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
    ></svg>
  );
};

const createTextFiller = (
  lines,
  {
    dx,
    dy,
    fontSize,
    fontFamily,
    fontWeight,
    letterSpacing,
    lineHeight,
    svgElement,
    availableWidth,
    availableHeight,
    color,
  },
) => {
  const fontSizeBase = 10;
  let widthTaken;
  let heightTaken;
  let remainingWidth;
  let remainingHeight;
  let currentParagraph;
  const paragraphs = [];
  const startNewParagraph = () => {
    endCurrentParagraph();
    currentParagraph = { width: 0, height: 0, lines: [] };
    renderLines([]);
    currentParagraph.width = widthTaken;
    currentParagraph.height = heightTaken;
  };
  const addToCurrentParagraph = (lineChildren) => {
    currentParagraph.lines.push(lineChildren);
  };
  const endCurrentParagraph = () => {
    if (currentParagraph && currentParagraph.lines.length) {
      currentParagraph.width = widthTaken;
      currentParagraph.height = heightTaken;
      paragraphs.push(currentParagraph);
    }
  };
  const renderLines = (lines) => {
    const textChildren = [];
    let lineIndex = 0;
    for (const lineChildren of lines) {
      textChildren.push(
        <Tspan
          x="0"
          y="0"
          dx={dx}
          dy={dy + lineHeight * fontSizeBase * lineIndex}
        >
          {lineChildren}
        </Tspan>,
      );
      lineIndex++;
    }
    render(
      <text
        font-size={fontSize}
        font-family={fontFamily}
        font-weight={fontWeight}
        letter-spacing={letterSpacing}
        color={color}
      >
        {textChildren}
      </text>,
      svgElement,
    );
    const { width, height } = svgElement.getBBox();
    widthTaken = Math.ceil(width);
    heightTaken = Math.ceil(height);
    remainingWidth = availableWidth - widthTaken;
    remainingHeight = availableHeight - heightTaken;
  };
  startNewParagraph();
  let lineIndex = 0;
  let debug = true;
  if (debug) {
    console.log(
      `compute paragraphs fitting into ${availableWidth}x${availableHeight}`,
    );
  }
  while (lineIndex < lines.length) {
    const line = lines[lineIndex];
    let lineChildIndex = 0;
    let childrenFittingOnThatLine = [];
    while (lineChildIndex < line.length) {
      const lineChild = line[lineChildIndex];
      const childrenCandidateToFit = line.slice(0, lineChildIndex + 1);
      const linesCandidateToFit = [
        ...currentParagraph.lines,
        childrenCandidateToFit,
      ];
      renderLines(linesCandidateToFit);
      if (remainingWidth >= 0) {
        childrenFittingOnThatLine.push(lineChild);
        // there is still room for this char
        lineChildIndex++;
        continue;
      }
      if (lineChild === " ") {
        childrenFittingOnThatLine = line.slice(0, lineChildIndex);
        const childrenPushedNextLine = line.slice(lineChildIndex + 1);
        lines.splice(lineIndex + 1, 0, childrenPushedNextLine);
        if (debug) {
          console.log("overflow on space at", lineChildIndex, {
            childrenPushedNextLine,
          });
        }
        break;
      }
      if (lineChildIndex === 0) {
        childrenFittingOnThatLine = [lineChild];
        const childrenPushedNextLine = line.slice(lineChildIndex + 1);
        lines.splice(lineIndex + 1, 0, childrenPushedNextLine);
        if (debug) {
          console.log("overflow on first char", {
            childrenFittingOnThatLine,
            childrenPushedNextLine,
          });
        }
        break;
      }
      let splitIndex = -1;
      let previousChildIndex = lineChildIndex;
      while (previousChildIndex--) {
        const previousChild = line[previousChildIndex];
        if (previousChild === " ") {
          splitIndex = previousChildIndex;
          break;
        }
      }
      if (splitIndex === -1) {
        // there is no room for this char and no previous char to split on
        // we split the word exactly on that char
        // we must inject a new line with the remaining chars from that line
        childrenFittingOnThatLine = line.slice(0, lineChildIndex);
        const childrenPushedNextLine = line.slice(lineChildIndex);
        lines.splice(lineIndex + 1, 0, childrenPushedNextLine);
        break;
      }
      childrenFittingOnThatLine = line.slice(0, splitIndex);
      const childrenPushedNextLine = line.slice(splitIndex + 1);
      lines.splice(lineIndex + 1, 0, childrenPushedNextLine);
      break;
    }
    if (remainingHeight >= 0) {
      // cette ligne tiens en hauteur
      addToCurrentParagraph(childrenFittingOnThatLine);
      if (debug) {
        console.log("fit in height", childrenFittingOnThatLine);
      }
      lineIndex++;
      continue;
    }
    // cette ligne dépasse en hauteur
    if (currentParagraph.length === 0) {
      // c'est la premiere ligne, on autorise quand meme
      addToCurrentParagraph(childrenFittingOnThatLine);
      startNewParagraph();
      lineIndex++;
      continue;
    }
    startNewParagraph();
    addToCurrentParagraph(childrenFittingOnThatLine);
    lineIndex++;
  }
  endCurrentParagraph();
  if (debug) {
    console.log("resulting paragraphs", paragraphs);
  }

  renderLines(paragraphs[0].lines);
  svgElement.style.width = paragraphs[0].width;
  svgElement.style.height = paragraphs[0].height;
  let paragraphIndex = 0;
  const fillNext = () => {
    const paragraph = paragraphs[paragraphIndex];
    paragraphIndex++;
    return {
      done: paragraphIndex === paragraphs.length,
      value: paragraph,
    };
  };
  return fillNext;
};

const Tspan = ({
  fontSize,
  fontFamily,
  fontWeight,
  letterSpacing,
  color,
  children,
  ...props
}) => {
  return (
    <tspan
      font-size={isFinite(fontSize) ? `${parseInt(fontSize)}px` : fontSize}
      font-family={fontFamily}
      font-weight={fontWeight}
      letter-spacing={letterSpacing}
      fill={color}
      {...props}
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
  const visitChildren = (children) => {
    if (children === null) {
      return [];
    }
    if (typeof children === "number") {
      children = [String(children)];
    }
    if (typeof children === "string") {
      children = [children];
    }
    const lines = [];
    let line = [];
    for (const child of children) {
      if (typeof child === "string") {
        const chars = child.split("");
        for (const char of chars) {
          if (char === "\n") {
            lines.push(line);
            line = [];
          } else {
            line.push(char);
          }
        }
      } else if (child.type === "br") {
        lines.push(line);
        line = [];
      } else if (child.type.displayName?.includes("TextComponent")) {
        const { props } = child;
        const { children, ...childProps } = props;
        const [firstNestedLine, ...remainingNestedLines] =
          visitChildren(children);
        for (const part of firstNestedLine) {
          line.push(<Tspan {...childProps}>{part}</Tspan>);
        }
        if (remainingNestedLines.length) {
          for (const remainingNestedLine of remainingNestedLines) {
            const remainingLine = [];
            for (const remainingPart of remainingNestedLine) {
              remainingLine.push(
                <Tspan {...childProps}>{remainingPart}</Tspan>,
              );
            }
            lines.push(remainingLine);
          }
        }
      } else {
        line.push(child);
      }
    }
    if (line.length) {
      lines.push(line);
    }
    return lines;
  };
  return visitChildren(text);
};

// const div = document.createElement("div");
// div.name = "svg_text_measurer";
// div.style.position = "absolute";
// div.style.visibility = "hidden";
// document.body.appendChild(div);
// const measureText = (text) => {
//   render(<Text>{text}</Text>, div);
//   const svg = div.querySelector("svg");
//   const { width, height } = svg.getBBox();
//   return [Math.ceil(width), Math.ceil(height)];
// };
