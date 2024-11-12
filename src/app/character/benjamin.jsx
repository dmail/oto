import { SpriteSheet } from "../sprite/spritesheet.jsx";
import { useState, useEffect } from "preact/hooks";

const characterSpritesheetUrl = new URL(
  "./character_spritesheet.png",
  import.meta.url,
);

const HERO_STATE_CELL = {
  walking_bottom_a: { x: 0 + 9, y: 0 + 17 },
  walking_bottom_b: { x: 17 + 9, y: 0 + 17 },
  walking_left_a: { x: 17 * 2 + 9, y: 0 + 17 },
  walking_left_b: { x: 17 * 3 + 9, y: 0 + 17 },
  walking_top_a: { x: 17 * 4 + 9, y: 0 + 17 },
  walking_top_b: { x: 17 * 5 + 9, y: 0 + 17 },
  walking_right_a: { x: 17 * 2 + 9, y: 0 + 17, mirrorX: true },
  walking_right_b: { x: 17 * 3 + 9, y: 0 + 17, mirrorX: true },
};

export const Benjamin = ({
  direction = "top",
  activity = "", // 'walking', 'jumping', 'pushing', 'wondering'
}) => {
  const animated = activity !== "";
  const [frame, frameSetter] = useState("a");
  useEffect(() => {
    if (!animated) return () => {};
    const interval = setInterval(() => {
      frameSetter((frameCurrent) => {
        return frameCurrent === "a" ? "b" : "a";
      });
    }, 400);
    return () => {
      clearInterval(interval);
    };
  }, [animated]);

  const { x, y, mirrorX, mirrorY } =
    HERO_STATE_CELL[`${activity}_${direction}_${frame}`];
  return (
    <SpriteSheet
      url={characterSpritesheetUrl}
      x={x}
      y={y}
      width={17}
      height={17}
      mirrorX={mirrorX}
      mirrorY={mirrorY}
      transparentColor={[
        [0, 206, 206],
        [0, 155, 155],
      ]}
    />
  );
};
