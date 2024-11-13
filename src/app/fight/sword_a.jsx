import { SpriteSheet } from "../sprite/spritesheet.jsx";

const weaponSpriteSheetUrl = new URL("./weapon.png", import.meta.url);

const WEAPON_CELLS = {
  sword_a: { x: 193, y: 0 + 17, width: 64, height: 64 },
};

export const SwordA = () => {
  const { x, y, width, height } = WEAPON_CELLS[`sword_a`];
  return (
    <SpriteSheet
      url={weaponSpriteSheetUrl}
      x={x}
      y={y}
      width={width}
      height={height}
    />
  );
};
