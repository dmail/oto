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
import { useImperativeHandle, useState } from "preact/hooks";
import { useKeyEffect } from "../../hooks/use_key_effect.js";
import { Box } from "../../layout/box.jsx";
import { Message } from "../message/message.jsx";

export const DialogTextBox = forwardRef(
  ({ color = "white", backgroundColor = "blue", ...props }, ref) => {
    const [text, textSetter] = useState("");

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

    useImperativeHandle(ref, () => {
      return {
        alert: async (text) => {
          textSetter(text);
        },
      };
    });

    return (
      <Box {...props} hidden={!text}>
        <Message color={color} backgroundColor={backgroundColor}>
          {text}
        </Message>
      </Box>
    );
  },
);
