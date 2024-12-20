import { render } from "preact";
import { forwardRef } from "preact/compat";
import { useCallback, useLayoutEffect, useRef, useState } from "preact/hooks";
import { useResizeObserver } from "/app/hooks/use_resize_observer.js";
import { useStructuredMemo } from "/app/hooks/use_structured_memo.js";
import { getAvailableSize } from "/app/utils/get_available_size.js";

let isUpdatingText = false;

export const useTextController = () => {
  const [index, indexSetter] = useState(-1);
  const [paragraphs, paragraphsSetter] = useState([]);
  const hasPrev = index > 0 && paragraphs.length > 0;
  const hasNext = index !== paragraphs.length - 1 && paragraphs.length > 0;
  const prev = useCallback(() => {
    if (hasPrev) {
      indexSetter((current) => current - 1);
    }
  }, [hasPrev]);
  const next = useCallback(() => {
    if (hasNext) {
      indexSetter((current) => current + 1);
    }
  }, [hasNext]);

  const onParagraphChange = useCallback((paragraphs) => {
    indexSetter(0);
    paragraphsSetter(paragraphs);
  }, []);

  return useStructuredMemo({
    index,
    hasPrev,
    hasNext,
    hasContent: paragraphs.length > 0,
    prev,
    next,
    onParagraphChange,
  });
};

export const useFontsReady = (fontFamily) => {
  const checkResult = document.fonts.check(`12px ${fontFamily}`);
  const [ready, readySetter] = useState(false);

  if (checkResult) {
    return true;
  }
  document.fonts.ready.then(() => {
    readySetter(true);
  });
  return ready;
};

const TextComponent = ({
  // name,
  controller,
  dx = 0,
  dy = 0,
  fontFamily = "goblin",
  fontSize = "0.7em",
  fontWeight,
  children,
  color,
  outlineColor,
  outlineSize = 1,
  letterSpacing,
  lineHeight = 1.4,
  visible = true,
  overflow = "visible",
  ...props
}) => {
  children = normalizeChildren(children);
  const lines = splitLines(children);
  const svgInnerRef = useRef();
  const textRef = useRef();
  const setParagraphRef = useRef();
  const index = controller?.index;
  const onParagraphChange = controller?.onParagraphChange;
  const fontReady = useFontsReady(fontFamily);
  const fontSizeResolvedRef = useRef(fontSize);
  const lineAsDeps = [];
  for (const line of lines) {
    for (const lineChild of line) {
      lineAsDeps.push(lineChild.type);
      lineAsDeps.push(lineChild.value);
      lineAsDeps.push(lineChild.char);
    }
  }

  const deps = [
    ...lineAsDeps,
    dx,
    dy,
    lineHeight,
    overflow,
    fontSize,
    fontFamily,
    fontWeight,
    letterSpacing,
    color,
    outlineColor,
    outlineSize,
    onParagraphChange,
    fontReady,
  ];

  const [, , observe, unobserve] = useResizeObserver(
    {
      ref: svgInnerRef,
      getElementToObserve: (svg) => svg.parentNode,
      onResize: () => {
        console.log("reiszing");
        isUpdatingText = true;
        update();
        requestAnimationFrame(() => {
          isUpdatingText = false;
        });
      },
      ignoreInitial: true,
    },
    deps,
  );

  const update = () => {
    unobserve();
    const svgElement = svgInnerRef.current;
    const textElement = textRef.current;
    const [paragraphs, setParagraph] = initTextFiller(lines, {
      dx,
      dy,
      lineHeight,
      overflow,

      fontSize,
      fontFamily,
      fontWeight,
      letterSpacing,
      color,
      outlineColor,
      outlineSize,

      controller,
      svgElement,
      textElement,
    });
    setParagraphRef.current = setParagraph;
    if (onParagraphChange) {
      onParagraphChange(paragraphs);
    } else {
      setParagraph(0);
    }
    observe();
  };

  useLayoutEffect(() => {
    let { fontSize } = window.getComputedStyle(svgInnerRef.current, null);
    fontSize = parseFloat(fontSize);
    fontSizeResolvedRef.current = fontSize;
    update();
  }, deps);

  useLayoutEffect(() => {
    if (typeof index === "number" && setParagraphRef.current) {
      setParagraphRef.current(controller.index);
    }
  }, [index, setParagraphRef.current]);

  return (
    <svg
      {...props}
      ref={svgInnerRef}
      xmlns="http://www.w3.org/2000/svg"
      style={{
        ...props.style,
        display: "block",
        pointerEvents: visible ? "auto" : "none",
        dominantBaseline: "text-before-edge",
        overflow: "visible",
      }}
    >
      <text ref={textRef}></text>
    </svg>
  );
};
export const Text = forwardRef(TextComponent);
Text.bold = ({ children }) => {
  return <Text fontWeight="bold">{children}</Text>;
};

const initTextFiller = (
  lines,
  {
    dx,
    dy,
    lineHeight,
    svgElement,
    textElement,
    overflow,
    fontSize,
    fontFamily,
    fontWeight,
    letterSpacing,
    color,
    outlineColor,
    outlineSize = 1,
  },
) => {
  lines = [...lines];
  let widthTaken;
  let heightTaken;
  let hasOverflowX;
  let hasOverflowY;
  const renderLines = (lines) => {
    const textChildren = [];
    let lineIndex = 0;
    for (const lineChildren of lines) {
      const lineChildrenValues = [];
      for (const lineChild of lineChildren) {
        lineChildrenValues.push(lineChild.value);
      }
      textChildren.push(
        <Tspan
          x="0"
          y="0"
          dx={dx}
          dy={dy + lineHeight * fontSize * lineIndex}
          fontSize={fontSize}
          fontFamily={fontFamily}
          fontWeight={fontWeight}
          letterSpacing={letterSpacing}
          color={color}
          outlineColor={outlineColor}
          outlineSize={outlineSize}
        >
          {lineChildrenValues}
        </Tspan>,
      );
      lineIndex++;
    }
    // render(null, svgElement);
    render(<>{textChildren}</>, textElement);
    const { width, height } = textElement.getBBox();
    widthTaken = width;
    heightTaken = height;
    svgElement.style.width = `${Math.ceil(widthTaken)}px`;
    svgElement.style.height = `${Math.ceil(heightTaken)}px`;
    const [availableWidth, availableHeight] = getAvailableSize(
      svgElement.parentNode,
    );
    hasOverflowX = widthTaken > availableWidth;
    hasOverflowY = heightTaken > availableHeight;
  };

  let currentParagraph;
  const paragraphs = [];

  const startNewParagraph = () => {
    endCurrentParagraph();
    currentParagraph = { width: 0, height: 0, lines: [] };
    renderLines(currentParagraph.lines);
    currentParagraph.width = widthTaken;
    currentParagraph.height = heightTaken;
  };
  const addToCurrentParagraph = (lineChildren) => {
    currentParagraph.lines.push(lineChildren);
  };
  const endCurrentParagraph = () => {
    if (currentParagraph && currentParagraph.lines.length) {
      renderLines(currentParagraph.lines); // sometimes not neccessary
      currentParagraph.width = widthTaken;
      currentParagraph.height = heightTaken;
      paragraphs.push(currentParagraph);
    }
  };

  const setParagraph = (paragraph) => {
    renderLines(paragraph.lines);
  };
  startNewParagraph();
  let lineIndex = 0;
  let debug = false;
  if (debug) {
    console.log(`compute paragraphs fitting`);
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
      if (!hasOverflowX) {
        childrenFittingOnThatLine.push(lineChild);
        // there is still room for this char
        lineChildIndex++;
        continue;
      }
      if (lineChild.char === " ") {
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
        if (previousChild.char === " ") {
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
    if (!hasOverflowY) {
      // cette ligne tiens en hauteur
      addToCurrentParagraph(childrenFittingOnThatLine);
      if (debug) {
        console.log("fit in height", childrenFittingOnThatLine);
      }
      lineIndex++;
      continue;
    }
    if (overflow === "ellipsis" && currentParagraph.lines.length > 0) {
      const previousLine =
        currentParagraph.lines[currentParagraph.lines.length - 1];
      previousLine[previousLine.length - 1] = {
        type: "char",
        value: ".",
        char: ".",
      };
    }
    // cette ligne dépasse en hauteur
    if (overflow === "visible") {
      addToCurrentParagraph(childrenFittingOnThatLine);
      lineIndex++;
      continue;
    }
    if (currentParagraph.length === 0) {
      addToCurrentParagraph(childrenFittingOnThatLine);
      startNewParagraph();
      lineIndex++;
      continue;
    }
    startNewParagraph();
    addToCurrentParagraph(childrenFittingOnThatLine);
    lineIndex++;
    continue;
  }
  endCurrentParagraph();
  if (debug) {
    console.log("resulting paragraphs", paragraphs);
  }

  return [
    paragraphs,
    (index) => {
      const p = paragraphs[index];
      if (p) {
        setParagraph(p);
      }
    },
  ];
};

const Tspan = ({
  fontSize,
  fontFamily,
  fontWeight,
  letterSpacing,
  color,
  outlineColor,
  outlineSize = 1,
  children,
  ...props
}) => {
  const thickness = fontWeight === "bold" ? 1 : 0;
  return (
    <tspan
      font-size={isFinite(fontSize) ? `${parseInt(fontSize)}px` : fontSize}
      font-family={fontFamily}
      font-weight={fontWeight}
      letter-spacing={letterSpacing}
      fill={color === "inherit" ? "currentColor" : color}
      {...(outlineColor
        ? {
            "stroke":
              outlineColor === "inherit" ? "currentColor" : outlineColor,
            "stroke-width": thickness + outlineSize,
            "paint-order": "stroke",
          }
        : {})}
      {...props}
    >
      {children}
    </tspan>
  );
};

const normalizeChildren = (children) => {
  if (children === null || children === undefined) {
    return [];
  }
  if (typeof children === "number") {
    return [String(children)];
  }
  if (typeof children === "string") {
    return [children];
  }
  return children;
};

const splitLines = (text) => {
  const visitChildren = (children) => {
    if (children === null || children === undefined) {
      return [];
    }
    if (typeof children === "number") {
      children = [String(children)];
    }
    if (typeof children === "string") {
      children = [children];
    }
    const lines = [];
    let line;

    const startNewLine = () => {
      endCurrentLine();
      line = [];
    };
    const addChar = (char) => {
      line.push({
        type: "char",
        value: char,
        char,
      });
    };
    const addChild = (child, parentChild) => {
      line.push({
        type: "component",
        value: child,
        char:
          typeof parentChild.value === "string"
            ? parentChild.value
            : parentChild.char,
      });
    };
    const endCurrentLine = () => {
      if (line) {
        lines.push(line);
      }
    };
    startNewLine();
    for (const child of children) {
      if (typeof child === "string") {
        const chars = child.split("");
        for (const char of chars) {
          if (char === "\n") {
            // addChar("\n");
            startNewLine();
          } else {
            addChar(char);
          }
        }
      } else if (child.type === "br") {
        // addChar("\n");
        startNewLine();
      } else if (child.type.displayName?.includes("TextComponent")) {
        const { props } = child;
        const { children, ...childProps } = props;
        const [firstNestedLine, ...remainingNestedLines] =
          visitChildren(children);
        for (const part of firstNestedLine) {
          addChild(<Tspan {...childProps}>{part.value}</Tspan>, part);
        }
        for (const remainingNestedLine of remainingNestedLines) {
          startNewLine();
          for (const remainingPart of remainingNestedLine) {
            addChild(
              <Tspan {...childProps}>{remainingPart}</Tspan>,
              remainingPart,
            );
          }
        }
      } else {
        addChild(child);
      }
    }
    if (line.length) {
      endCurrentLine();
    }
    return lines;
  };
  return visitChildren(text);
};

/*
 * This component will put a resize observer on its parent element
 * in order to update the text dimensions when the parent element size changes.
 * When parent size is dynamic it means the parent size will be updated when trying to fit text to the parent
 * For this reason we disable resize observer while trying to fit text to parent
 * However the browser still complains about this because pattern as it could lead to infinite loop or bad design
 * We know what we are doing
 * - it won't lead to infinite loop, we just want to fit text to parent
 * - it won't cause layout shift or cyclic layout dependencies
 * -> we can safely ignore this error
 * (.preventDefault() is used to prevent the error from being displayed by jsenv supervisor)
 */
window.addEventListener("error", (errorEvent) => {
  if (
    isUpdatingText &&
    errorEvent.message.includes(
      "ResizeObserver loop completed with undelivered notifications.",
    )
  ) {
    errorEvent.stopImmediatePropagation();
    errorEvent.preventDefault();
    return;
  }
});

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
