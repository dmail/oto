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

export const Button = ({ children, color, ...props }) => {
  const [hovered, hoveredSetter] = useState(false);

  return (
    <Box.button
      onMouseEnter={() => {
        hoveredSetter(true);
      }}
      onMouseLeave={() => {
        hoveredSetter(false);
      }}
      color={hovered ? "dodgerblue" : color}
      {...props}
    >
      {children}
    </Box.button>
  );
};

export const ButtonMessage = ({ children, width, height, ...props }) => {
  return (
    <Button
      color="white"
      cursor="pointer"
      width={width}
      height={height}
      {...props}
    >
      <Message width={width} height={height} cursor="pointer">
        {children}
      </Message>
    </Button>
  );
};
