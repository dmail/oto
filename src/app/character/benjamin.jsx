import { useLayoutEffect, useRef } from "preact/hooks";
import { useFrame } from "../animations/use_frame.js";
import { useDrawImage } from "../hooks/use_draw_image.js";
import { useSprite } from "../hooks/use_sprite.js";

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
  elementRef = useRef(),
  direction = "top",
  activity = "", // 'walking', 'jumping', 'pushing', 'wondering'
  animate = true,
  ...props
}) => {
  const hasAnimation = activity !== "";
  const [frame, playFrameAnimation, pauseFrameAnimation] = useFrame(
    ["a", "b"],
    { loop: true },
  );
  useLayoutEffect(() => {
    if (!animate || !hasAnimation) return () => {};
    playFrameAnimation();
    return pauseFrameAnimation;
  }, [animate, hasAnimation, playFrameAnimation, pauseFrameAnimation]);

  const { x, y, mirrorX, mirrorY } =
    HERO_STATE_CELL[`${activity}_${direction}_${frame}`];
  const sprite = useSprite({
    url: characterSpritesheetUrl,
    x,
    y,
    width: 17,
    height: 17,
    mirrorX,
    mirrorY,
    transparentColor: [
      [0, 206, 206],
      [0, 155, 155],
    ],
  });
  useDrawImage(elementRef.current, sprite);

  return (
    <canvas
      {...props}
      name="benjamin"
      ref={elementRef}
      width={17}
      height={17}
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  );
};
