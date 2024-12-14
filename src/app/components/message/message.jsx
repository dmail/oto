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
    borderColor = "green",
    borderOutlineColor = "red",
    borderOutlineSize = 5,
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
      borderRadius={0}
      borderColor={borderColor}
      borderOutlineColor={borderOutlineColor}
      borderSize={10}
      borderOutlineSize={borderOutlineSize}
      {...props}
      style={{
        // backgroundColor,
        // outline: `1px solid ${outlineColor}`,
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
