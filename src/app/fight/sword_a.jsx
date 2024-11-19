import { SpriteSheet } from "../canvas/spritesheet.jsx";

const weaponSpriteSheetUrl = new URL("./weapon.png", import.meta.url);

const WEAPON_CELLS = {
  sword_a: { x: 190, y: 270, width: 64, height: 64 },
};

export const SwordA = (props) => {
  const { x, y, width, height } = WEAPON_CELLS[`sword_a`];
  return (
    <SpriteSheet
      {...props}
      name="sword_a"
      url={weaponSpriteSheetUrl}
      x={x}
      y={y}
      width={width}
      height={height}
    />
  );
};
