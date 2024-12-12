/*
il faut qu'on puisse aficher ce qui rentre dans la boite de dialogue
et on peut passer a la suite avec enter/clic ou que sais-je
lorsqu'on arrive a la fin une promise se resolve
donc on a besoin d'une fonction je dirais
hummmm

ptet un [dialog, displayDialog] = useDialogText()

aui retourne une fonction qui se resolve dans un cas précis

*/

import { render } from "preact";
import { forwardRef } from "preact/compat";
import {
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "preact/hooks";
import { useKeyEffect } from "../../hooks/use_key_effect.js";
import { Message } from "../message/message.jsx";
import { Text, splitLines } from "/app/text/text.jsx";
import { getAvailableSize } from "/app/utils/get_available_size.js";

const DialogTextBoxComponent = (
  { color = "white", backgroundColor = "blue", children = "", ...props },
  ref,
) => {
  const [text, textSetter] = useState("");
  const messageElementRef = useRef();

  useKeyEffect({
    Enter: {
      enabled: Boolean(text),
      callback: () => {},
    },
    Space: {
      enabled: Boolean(text),
      callback: () => {},
    },
  });

  const alert = (text) => {
    const fillNext = startFill(text, messageElementRef.current);
    const textFitting = fillNext();
    textSetter(textFitting);
    setTimeout(() => {
      textSetter("");
    }, 100);
  };

  useLayoutEffect(() => {
    if (children) {
      alert(children);
    }
  }, [children]);

  useImperativeHandle(ref, () => {
    return {
      alert,
    };
  });

  return (
    <Message
      ref={messageElementRef}
      color={color}
      backgroundColor={backgroundColor}
      invisible={!text}
      width="100%"
      height="100%"
      maxWidth="100%"
      {...props}
    >
      {text}
    </Message>
  );
};

export const DialogTextBox = forwardRef(DialogTextBoxComponent);

const div = document.createElement("div");
div.name = "svg_text_measurer";
div.style.position = "absolute";
div.style.visibility = "hidden";
document.body.appendChild(div);
const measureText = (text) => {
  render(<Text>{text}</Text>, div);
  const svg = div.querySelector("svg");
  const { width, height } = svg.getBBox();
  return [Math.ceil(width), Math.ceil(height)];
};

const startFill = (text, textContainer) => {
  const [availableWidth, availableHeight] = getAvailableSize(textContainer);
  console.log({ availableWidth, availableHeight });
  const lines = splitLines(text);
  // keep adding characters until there is no more room
  // then go to next line
  // ideally do not truncate a character but rather go to line
  // if the word is too big we'll truncate it somehow but the concern for now
  let lineIndex = 0;
  let charIndex;

  const fillNext = () => {
    let textFitting = "";
    while (lineIndex < lines.length) {
      const line = lines[lineIndex];
      charIndex = 0;
      let textFittingOnThatLine = "";
      let xOverflow = false;
      while (charIndex < line.length) {
        const char = line[charIndex];
        const textCandidateToFit = line.slice(0, charIndex);
        const [widthTaken] = measureText(textCandidateToFit);
        const remainingWidth = availableWidth - widthTaken;
        if (remainingWidth >= 0) {
          // there is still room for this char
          charIndex++;
          continue;
        }
        xOverflow = true;
        if (char === " ") {
          textFittingOnThatLine = line.slice(0, charIndex);
          const textPushedNextLine = line.slice(charIndex + 1);
          lines.splice(lineIndex + 1, 0, textPushedNextLine);
          break;
        }
        if (charIndex === 0) {
          textFittingOnThatLine = line[charIndex];
          const textPushedNextLine = line.slice(charIndex);
          lines.splice(lineIndex + 1, 0, textPushedNextLine);
          break;
        }
        let splitIndex = -1;
        let previousCharIndex = charIndex;
        while (previousCharIndex--) {
          const previousChar = line[previousCharIndex];
          if (previousChar === " ") {
            splitIndex = previousCharIndex;
            break;
          }
        }
        if (splitIndex === -1) {
          // there is no room for this char and no previous char to split on
          // we split the word exactly on that char
          // we must inject a new line with the remaining chars from that line
          textFittingOnThatLine = line.slice(0, charIndex);
          const textPushedNextLine = line.slice(charIndex);
          lines.splice(lineIndex + 1, 0, textPushedNextLine);
          break;
        }
        textFittingOnThatLine = line.slice(0, splitIndex);
        const textPushedNextLine = line.slice(splitIndex + 1);
        lines.splice(lineIndex + 1, 0, textPushedNextLine);
        break;
      }
      if (!xOverflow) {
        // if I reach this point without x overflow we managed to put all chars on the line
        textFittingOnThatLine = line;
      }
      textFitting += textFittingOnThatLine;
      if (lineIndex < lines.length - 1) {
        textFitting += "\n";
      }
      const [, heightTaken] = measureText(textFitting);
      const remainingHeight = availableHeight - heightTaken;
      if (remainingHeight < 0) {
        break;
      }
      lineIndex++;
    }
    return textFitting;
  };

  return fillNext;
};
