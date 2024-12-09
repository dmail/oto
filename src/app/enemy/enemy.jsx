import { useRef } from "preact/hooks";
import { useDrawImage } from "../hooks/use_draw_image.js";
import { useSprite } from "../hooks/use_sprite.js";

export const Enemy = ({
  name,
  elementRef = useRef(),
  url,
  x,
  y,
  width = 62,
  height = 62,
  transparentColor,
  ...props
}) => {
  const sprite = useSprite({
    name,
    url,
    x,
    y,
    width,
    height,
    transparentColor,
  });
  useDrawImage(elementRef.current, sprite);

  return (
    <canvas
      {...props}
      name={name}
      ref={elementRef}
      width={width}
      height={height}
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  );
};
