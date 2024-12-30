import { useDrawImage } from "hooks/use_draw_image.js";
import { useSprite } from "hooks/use_sprite.js";
import { useRef } from "preact/hooks";

const weaponSpriteSheetUrl = new URL("./weapon.png", import.meta.url);

const WEAPON_CELLS = {
  sword_a: { x: 195, y: 265, width: 64, height: 64 },
};

export const SwordA = ({ elementRef = useRef(), ...props }) => {
  const { x, y, width, height } = WEAPON_CELLS[`sword_a`];
  const sprite = useSprite({
    url: weaponSpriteSheetUrl,
    x,
    y,
    width,
    height,
  });
  useDrawImage(elementRef.current, sprite);

  return (
    <canvas
      {...props}
      name="sword_a"
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

export const SwordAIcon = ({ elementRef = useRef(), ...props }) => {
  const { x, y, width, height } = WEAPON_CELLS[`sword_a`];
  const sprite = useSprite({
    url: weaponSpriteSheetUrl,
    x,
    y,
    width,
    height,
  });
  useDrawImage(elementRef.current, sprite);
  return (
    <canvas
      {...props}
      name="sword_a"
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
