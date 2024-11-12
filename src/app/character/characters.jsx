import { SpriteSheet } from "../sprite/spritesheet.jsx";

const characterSpritesheetUrl = new URL(
  "./character_spritesheet.gif",
  import.meta.url,
);

const CharacterSpriteSheet = ({ col, row, ...rest }) => {
  return (
    <SpriteSheet
      url={characterSpritesheetUrl}
      x={col * 32}
      y={row * 32}
      width={18}
      height={18}
      {...rest}
    />
  );
};

const HERO_STATE_CELL = {
  idle_right_a: { col: 0, row: 1 },
  idle_right_b: { col: 1, row: 1 },
  idle_top_a: { col: 3, row: 1 },
  idle_top_b: { col: 4, row: 1 },
  idle_bottom_a: { col: 2, row: 2 },
  idle_bottom_b: { col: 3, row: 2 },
  idle_left_a: { col: 0, row: 1, mirrorX: true },
  idle_left_b: { col: 1, row: 1, mirrorX: true },
};

export const Hero = ({
  direction = "top",
  // jumping = false,
  // pushing = false,
  // wondering = false,
}) => {
  const { col, row, mirrorX, mirrorY } = HERO_STATE_CELL[`idle_${direction}_a`];
  return (
    <CharacterSpriteSheet
      col={col}
      row={row}
      mirrorX={mirrorX}
      mirrorY={mirrorY}
    />
  );
};
