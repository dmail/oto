import { Message } from "/app/components/message/message.jsx";
import { Box } from "/app/layout/box.jsx";

export const MenuFight = () => {
  return (
    <Box.button y="end">
      <Message>Attaque</Message>
    </Box.button>
  );
};
