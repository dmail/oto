import { useRef } from "preact/hooks";
import { useDrawImage } from "../hooks/use_draw_image.js";
import { useSprite } from "../hooks/use_sprite.js";

const battleBackgroundsSpritesheetUrl = new URL(
  "./battle_background_spritesheet.png",
  import.meta.url,
);

export const MountainAndSkyBattleBackground = ({
  elementRef = useRef(),
  ...props
}) => {
  const sprite = useSprite({
    url: battleBackgroundsSpritesheetUrl,
    x: 260 * 1 + 5,
    y: 100 * 0 + 0,
    width: 255,
    height: 200,
  });
  useDrawImage(elementRef, sprite);

  return (
    <canvas
      {...props}
      name="mountain_and_sky"
      ref={elementRef}
      width={255}
      height={200}
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  );
};
