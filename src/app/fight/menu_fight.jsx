import { useState } from "preact/hooks";
import { Message } from "/app/components/message/message.jsx";
import { Box } from "/app/layout/box.jsx";

export const MenuFight = ({ onAttack }) => {
  return (
    <Button
      y="end"
      onClick={() => {
        onAttack();
      }}
    >
      Attaque
    </Button>
  );
};

const Button = ({ children, ...props }) => {
  const [focused, focusedSetter] = useState(false);
  const [hovered, hoveredSetter] = useState(false);

  return (
    <Box.button
      onFocus={() => {
        focusedSetter(true);
      }}
      onMouseEnter={() => {
        hoveredSetter(true);
      }}
      onMouseLeave={() => {
        hoveredSetter(false);
      }}
      onBlur={() => {
        focusedSetter(false);
      }}
      {...props}
    >
      <Message
        color={focused || hovered ? "yellow" : undefined}
        cursor="pointer"
      >
        {children}
      </Message>
    </Box.button>
  );
};
