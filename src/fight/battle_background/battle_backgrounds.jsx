import { forwardRef } from "preact/compat";
import { Img } from "/components/img/img.jsx";

const battleBackgroundsSpritesheetUrl = new URL(
  "./battle_background_spritesheet.png",
  import.meta.url,
);

export const MountainAndSkyBattleBackground = forwardRef((props, ref) => {
  return (
    <Img
      ref={ref}
      name="mountain_and_sky"
      source={battleBackgroundsSpritesheetUrl}
      width="254"
      height="200"
      sourceX={260 * 1 + 5}
      sourceY={100 * 0 + 1}
      {...props}
    />
  );
});
