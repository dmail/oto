/*
il faut qu'on puisse aficher ce qui rentre dans la boite de dialogue
et on peut passer a la suite avec enter/clic ou que sais-je
lorsqu'on arrive a la fin une promise se resolve
donc on a besoin d'une fonction je dirais
hummmm

ptet un [dialog, displayDialog] = useDialogText()

aui retourne une fonction qui se resolve dans un cas précis

*/

import { forwardRef } from "preact/compat";
import {
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "preact/hooks";
import { useKeyEffect } from "../../hooks/use_key_effect.js";
import { Box } from "../../layout/box.jsx";
import { Message } from "../message/message.jsx";
import { measureText } from "/app/text/text.jsx";
import { getAvailableSize } from "/app/utils/get_available_size.js";

const DialogTextBoxComponent = (
  { color = "white", backgroundColor = "blue", children, ...props },
  ref,
) => {
  const [text, textSetter] = useState(children);
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

  useLayoutEffect(() => {
    if (!text) {
      return;
    }
    const messageElement = messageElementRef.current;
    // one I have the text I compute the available width/height
    // I use it to determine the text I can display in the box
    messageElement.style.width = "100vw";
    const [availableWidth, availableHeight] = getAvailableSize(messageElement);
    // now I should update again the text to display actually what I can display

    const [textWidth, textHeight] = measureText(text, { fontSize: 10 });
    console.log({ availableWidth, availableHeight, textWidth, textHeight });
  }, [text]);

  useImperativeHandle(ref, () => {
    return {
      alert: async (text) => {
        textSetter(text);
      },
    };
  });

  return (
    <Box {...props} hidden={!text}>
      <Message
        ref={messageElementRef}
        color={color}
        backgroundColor={backgroundColor}
      >
        {text}
      </Message>
    </Box>
  );
};

export const DialogTextBox = forwardRef(DialogTextBoxComponent);
