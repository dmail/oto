import { useRef } from "preact/hooks";
import { useDrawImage } from "../hooks/use_draw_image.js";
import { useSprite } from "../hooks/use_sprite.js";

const enemySpritesheetUrl = new URL("./enemy_spritesheet.png", import.meta.url);

export const FirstEnemy = ({ elementRef = useRef(), ...props }) => {
  const sprite = useSprite({
    url: enemySpritesheetUrl,
    x: 80,
    y: 10,
    width: 70,
    height: 80,
    transparentColor: [0, 128, 128],
  });
  useDrawImage(elementRef, sprite);

  return (
    <canvas
      {...props}
      name="taurus"
      ref={elementRef}
      width={70}
      height={80}
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  );
};
