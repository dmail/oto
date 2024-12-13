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
    // outlineColor = "black",
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
      {...props}
      style={{
        backgroundColor,
        border: `0.2em solid ${borderColor}`,
        borderRadius: "0.1em",
        //  outline: `1px solid ${outlineColor}`,
        userSelect: "none",
        ...props.style,
      }}
    >
      <Text
        ref={ref}
        controller={textController}
        color={color}
        overflow={overflow}
      >
        {children}
      </Text>
    </Box>
  );
};

export const Message = forwardRef(MessageComponent);
