import { useDrawImage } from "hooks/use_draw_image.js";
import { useSprite } from "hooks/use_sprite.js";
import { useRef } from "preact/hooks";

const battleBackgroundsSpritesheetUrl = new URL(
  "./battle_background_spritesheet.png",
  import.meta.url,
);

export const MountainAndSkyBattleBackground = ({
  elementRef = useRef(),
  ...props
}) => {
  const width = 254;
  const sprite = useSprite({
    url: battleBackgroundsSpritesheetUrl,
    x: 260 * 1 + 5,
    y: 100 * 0 + 1,
    width,
    height: 200,
  });
  useDrawImage(elementRef.current, sprite);

  return (
    <canvas
      {...props}
      name="mountain_and_sky"
      ref={elementRef}
      width={width}
      height={200}
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  );
};
