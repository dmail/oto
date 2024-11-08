import { SpriteSheet } from "./spritesheet.jsx";

const battleBackgroundsSpritesheetUrl = new URL(
  "./battle_backgrounds_spritesheet.png",
  import.meta.url,
);

export const BattleBackgroundSpriteSheet = ({ row, col }) => {
  return (
    <SpriteSheet
      url={battleBackgroundsSpritesheetUrl}
      colWidth={260}
      rowHeight={200}
      gapX={10}
      gapY={2}
      width={250}
      height={198}
      row={row}
      col={col}
    />
  );
};

export const MountainAndSkyBattleBackground = () => {
  return <BattleBackgroundSpriteSheet row={0} col={1} />;
};
