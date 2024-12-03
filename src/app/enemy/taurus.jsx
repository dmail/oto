import { useRef } from "preact/hooks";
import { useDrawImage } from "../hooks/use_draw_image.js";
import { useSprite } from "../hooks/use_sprite.js";

const enemySpritesheetUrl = new URL("./enemy_sprite.png", import.meta.url);
const hpAbove =
  (percentage) =>
  ({ hp, hpMax }) => {
    const hpRatio = hp / hpMax;
    const ratio = percentage / 100;
    return hpRatio > ratio;
  };

const states = {
  full_life: {
    hp: hpAbove(50),
    url: enemySpritesheetUrl,
    x: 450,
    y: 100,
  },
  mid_life: {
    hp: hpAbove(25),
    url: enemySpritesheetUrl,
    x: 515,
    y: 100,
  },
  low_life: {
    hp: () => true,
    url: enemySpritesheetUrl,
    x: 580,
    y: 100,
  },
};

export const Taurus = ({ elementRef = useRef(), hp, hpMax, ...props }) => {
  const stateKey = Object.keys(states).find((key) => {
    return states[key].hp({ hp, hpMax });
  });
  const { url, x, y } = states[stateKey];
  const width = 62;
  const height = 62;
  const sprite = useSprite({
    id: "taurus",
    url,
    x,
    y,
    width,
    height,
    transparentColor: [0, 202, 202],
  });
  useDrawImage(elementRef.current, sprite);

  return (
    <canvas
      {...props}
      name="taurus"
      ref={elementRef}
      width={width}
      height={height}
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  );
};
