import { SpriteSheet } from "./spritesheet.jsx";

const battleBackgroundsSpritesheetUrl = new URL(
  "./battle_background_spritesheet.png",
  import.meta.url,
);

export const BattleBackgroundSpriteSheet = ({ col, row }) => {
  return (
    <SpriteSheet
      url={battleBackgroundsSpritesheetUrl}
      x={col * 260 + 5}
      y={row * 100 + 5}
      width={255}
      height={200}
    />
  );
};

export const MountainAndSkyBattleBackground = () => {
  return <BattleBackgroundSpriteSheet col={1} row={0} />;
};
