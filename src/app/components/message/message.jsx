/*
* // message doit pouvoir avoir un
// borderInnerColor
// et un borderOuterColor
// donc a priori du svg la dedans
*/

import { forwardRef } from "preact/compat";
import { Box } from "/app/layout/box.jsx";
import { Text } from "/app/text/text.jsx";

const MessageComponent = (
  {
    children,
    backgroundColor = "black",
    borderColor = "white",
    outlineColor = "black",
    color = "white",
    maxLines,
    ...props
  },
  ref,
) => {
  return (
    <Box
      ref={ref}
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
      maxWidth="100%"
      cursor="default"
      {...props}
    >
      <Text color={color} maxLines={maxLines}>
        {children}
      </Text>
    </Box>
  );
};

export const Message = forwardRef(MessageComponent);
