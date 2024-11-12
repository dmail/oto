import { SpriteSheet } from "../sprite/spritesheet.jsx";
import { useState, useEffect } from "preact/hooks";

const characterSpritesheetUrl = new URL(
  "./character_spritesheet.png",
  import.meta.url,
);

const HERO_STATE_CELL = {
  idle_bottom_a: { col: 0, row: 0 },
  idle_bottom_b: { col: 1, row: 0 },
  idle_left_a: { col: 2, row: 1 },
  idle_left_b: { col: 3, row: 1 },
  idle_top_a: { col: 4, row: 1 },
  idle_top_b: { col: 5, row: 1 },
  idle_right_a: { col: 2, row: 1, mirrorX: true },
  idle_right_b: { col: 3, row: 1, mirrorX: true },
};

export const Benjamin = ({
  animated,
  direction = "top",
  // jumping = false,
  // pushing = false,
  // wondering = false,
}) => {
  const [frame, frameSetter] = useState("a");
  useEffect(() => {
    if (!animated) return () => {};
    const interval = setInterval(() => {
      frameSetter((frameCurrent) => {
        return frameCurrent === "a" ? "b" : "a";
      });
    }, 500);
    return () => {
      clearInterval(interval);
    };
  }, [animated]);

  const { col, row, mirrorX, mirrorY } =
    HERO_STATE_CELL[`idle_${direction}_${frame}`];
  return (
    <SpriteSheet
      url={characterSpritesheetUrl}
      x={col * 16 + 10}
      y={row * 16 + 16}
      width={16}
      height={16}
      mirrorX={mirrorX}
      mirrorY={mirrorY}
      transparentColor={[
        [0, 206, 206],
        [0, 155, 155],
      ]}
    />
  );
};
