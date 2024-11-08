import { SpriteSheet } from "../sprite/spritesheet.jsx";

const enemySpritesheetUrl = new URL("./enemy_spritesheet.png", import.meta.url);

export const EnemySpriteSheet = ({ col, row }) => {
  return (
    <SpriteSheet
      url={enemySpritesheetUrl}
      x={col * 50 + 80}
      y={row * 50 + 10}
      width={70}
      height={80}
    />
  );
};

export const FirstEnemy = () => {
  return <EnemySpriteSheet col={0} row={0} />;
};
