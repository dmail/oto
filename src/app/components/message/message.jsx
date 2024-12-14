/*
* // message doit pouvoir avoir un
// borderInnerColor
// et un borderOuterColor
// donc a priori du svg la dedans
*/

import { forwardRef } from "preact/compat";
import { Box } from "/app/components/box/box.jsx";
import { Text } from "/app/components/text/text.jsx";

const MessageComponent = (
  {
    children,
    backgroundColor = "black",
    borderRadius = 5,
    borderColor = "white",
    borderOutlineColor = "black",
    borderOutlineSize = 1,
    borderSize = 2,
    outlineColor = "black",
    color = "white",
    overflow,
    textController,
    ...props
  },
  ref,
) => {
  return (
    <Box
      x="center"
      y="center"
      height="100%"
      innerSpacing="0.4em"
      maxWidth="100%"
      cursor="default"
      backgroundColor={backgroundColor}
      borderColor={borderColor}
      borderOutlineColor={borderOutlineColor}
      borderSize={borderSize}
      borderOutlineSize={borderOutlineSize}
      borderRadius={borderRadius}
      {...props}
      style={{
        userSelect: "none",
        ...props.style,
      }}
    >
      <Text
        ref={ref}
        controller={textController}
        color={color}
        outlineColor={outlineColor}
        overflow={overflow}
      >
        {children}
      </Text>
    </Box>
  );
};

export const Message = forwardRef(MessageComponent);
