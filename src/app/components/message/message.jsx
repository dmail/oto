import { forwardRef } from "preact/compat";
import { Box, borderWithStroke } from "/app/components/box/box.jsx";
import { Text } from "/app/components/text/text.jsx";

const MessageComponent = (
  {
    children,
    backgroundColor = "black",
    color = "white",
    borderColor = "white",
    borderStrokeColor = "black",
    borderSize = 5,
    borderStrokeSize = 1,
    borderRadius = 5,
    textOutlineColor = "black",
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
      border={borderWithStroke({
        color: borderColor,
        size: borderSize,
        strokeColor: borderStrokeColor,
        strokeSize: borderStrokeSize,
        radius: borderRadius,
      })}
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
        outlineColor={textOutlineColor}
        overflow={overflow}
      >
        {children}
      </Text>
    </Box>
  );
};

export const Message = forwardRef(MessageComponent);
