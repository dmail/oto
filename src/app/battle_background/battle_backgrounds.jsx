import { SpriteSheet } from "../canvas/spritesheet.jsx";

const battleBackgroundsSpritesheetUrl = new URL(
  "./battle_background_spritesheet.png",
  import.meta.url,
);

export const MountainAndSkyBattleBackground = (props) => {
  return (
    <BattleBackgroundSpriteSheet
      className="mountain_and_sky"
      col={1}
      row={0}
      {...props}
    />
  );
};

const BattleBackgroundSpriteSheet = ({ col, row, ...props }) => {
  return (
    <SpriteSheet
      url={battleBackgroundsSpritesheetUrl}
      x={col * 260 + 5}
      y={row * 100 + 0}
      width={255}
      height={200}
      {...props}
    />
  );
};
