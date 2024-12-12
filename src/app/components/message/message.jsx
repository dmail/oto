/*
* // message doit pouvoir avoir un
// borderInnerColor
// et un borderOuterColor
// donc a priori du svg la dedans
*/

import { Box } from "/app/layout/box.jsx";
import { Text } from "/app/text/text.jsx";

export const Message = ({
  children,
  backgroundColor = "black",
  borderColor = "white",
  outlineColor = "black",
  color = "white",
  maxLines,
  ...props
}) => {
  return (
    <Box
      x="center"
      y="center"
      height="100%"
      style={{
        backgroundColor,
        border: `0.2em solid ${borderColor}`,
        borderRadius: "0.1em",
        outline: `1px solid ${outlineColor}`,
        userSelect: "none",
      }}
      innerSpacing="0.4em"
      cursor="default"
      {...props}
    >
      <Text color={color} maxLines={maxLines}>
        {children}
      </Text>
    </Box>
  );
};
