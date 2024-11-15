import { SpriteSheet } from "../canvas/spritesheet.jsx";

const enemySpritesheetUrl = new URL("./enemy_spritesheet.png", import.meta.url);

export const EnemySpriteSheet = ({ col, row, ...props }) => {
  return (
    <SpriteSheet
      transparentColor={[0, 128, 128]}
      url={enemySpritesheetUrl}
      x={col * 50 + 80}
      y={row * 50 + 10}
      width={70}
      height={80}
      {...props}
    />
  );
};

export const FirstEnemy = () => {
  return <EnemySpriteSheet name="taurus" col={0} row={0} />;
};
