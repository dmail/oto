import { useState } from "preact/hooks";
import buttonStylesheet from "./button.css" with { type: "css" };
import { Box } from "/app/components/box/box.jsx";
import { Message } from "/app/components/message/message.jsx";

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
  const [focused, focusedSetter] = useState(false);
  const [hovered, hoveredSetter] = useState(false);

  return (
    <Box.button
      focused={true}
      onFocus={() => {
        focusedSetter(true);
      }}
      onBlur={() => {
        focusedSetter(false);
      }}
      onMouseEnter={() => {
        hoveredSetter(true);
      }}
      onMouseLeave={() => {
        hoveredSetter(false);
      }}
      color={hovered ? "dodgerblue" : undefined}
      {...props}
    >
      {children}
    </Box.button>
  );
};

export const ButtonMessage = ({ children }) => {
  return (
    <Button>
      <Message cursor="pointer">{children}</Message>
    </Button>
  );
};
