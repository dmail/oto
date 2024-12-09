import { Box } from "/app/layout/box.jsx";
import { Text } from "/app/text/text.jsx";

export const Message = ({ children, ...props }) => {
  return (
    <Box
      x="center"
      y="center"
      height="100%"
      style={{
        background: "black",
        border: "0.2em solid white",
        borderRadius: "0.1em",
        outline: "1px solid black",
      }}
      innerSpacing="0.2em"
      {...props}
    >
      <Text color="white">{children}</Text>
    </Box>
  );
};
