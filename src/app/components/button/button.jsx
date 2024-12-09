import { useState } from "preact/hooks";
import { Message } from "../message/message.jsx";
import buttonStylesheet from "./button.css" with { type: "css" };
import { Box } from "/app/layout/box.jsx";

document.adoptedStyleSheets = [
  ...document.adoptedStyleSheets,
  buttonStylesheet,
];
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
      (s) => s !== buttonStylesheet,
    );
  });
}

export const Button = ({ children, ...props }) => {
  // const [focused, focusedSetter] = useState(false);
  const [hovered, hoveredSetter] = useState(false);

  return (
    <Box.button
      //   onFocus={() => {
      //     focusedSetter(true);
      //   }}
      //   onBlur={() => {
      //     focusedSetter(false);
      //   }}
      onMouseEnter={() => {
        hoveredSetter(true);
      }}
      onMouseLeave={() => {
        hoveredSetter(false);
      }}
      {...props}
    >
      <Message color={hovered ? "yellow" : undefined} cursor="pointer">
        {children}
      </Message>
    </Box.button>
  );
};
