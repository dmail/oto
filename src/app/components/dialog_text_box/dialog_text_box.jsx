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
import { useImperativeHandle, useRef, useState } from "preact/hooks";
import { Message } from "/app/components/message/message.jsx";
import { useTextController } from "/app/components/text/text.jsx";
import { useKeyEffect } from "/app/hooks/use_key_effect.js";

const DialogTextBoxComponent = (
  { color = "white", backgroundColor = "blue", children, ...props },
  ref,
) => {
  const [text, textSetter] = useState(children);
  const textController = useTextController();
  const messageElementRef = useRef();
  const alertPromiseRef = useRef();

  const next = () => {
    if (textController.hasNext) {
      textController.next();
    } else {
      textSetter(null);
      if (alertPromiseRef.current) {
        alertPromiseRef.current();
        alertPromiseRef.current = null;
      }
    }
  };

  useKeyEffect({
    Enter: {
      enabled: textController.hasContent,
      callback: () => {
        next();
      },
    },
    Space: {
      enabled: textController.hasContent,
      callback: () => {
        next();
      },
    },
  });

  const alert = (text) => {
    textSetter(text);
    return new Promise((resolve) => {
      alertPromiseRef.current = resolve;
    });
  };

  useImperativeHandle(ref, () => {
    return {
      alert,
    };
  });

  return (
    <Message
      ref={messageElementRef}
      textController={textController}
      color={color}
      backgroundColor={backgroundColor}
      invisible={!text}
      width="100%"
      height="100%"
      maxWidth="100%"
      overflow="hidden"
      innerSpacingY="0.7em"
      innerSpacingX="0.4em"
      onClick={() => {
        next();
      }}
      {...props}
    >
      {text}
    </Message>
  );
};

export const DialogTextBox = forwardRef(DialogTextBoxComponent);
