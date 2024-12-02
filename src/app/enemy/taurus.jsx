import { useRef } from "preact/hooks";
import { useDrawImage } from "../hooks/use_draw_image.js";
import { useSprite } from "../hooks/use_sprite.js";

const enemySpritesheetUrl = new URL("./enemy_spritesheet.png", import.meta.url);
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
    y: 90,
  },
  mid_life: {
    hp: hpAbove(25),
    url: enemySpritesheetUrl,
    x: 520,
    y: 90,
  },
  low_life: {
    hp: hpAbove(0),
    url: enemySpritesheetUrl,
    x: 240,
    y: 90,
  },
};

export const Taurus = ({ elementRef = useRef(), hp, hpMax, ...props }) => {
  const stateKey = Object.keys(states).find((key) => {
    return states[key].hp({ hp, hpMax });
  });
  const { url, x, y } = states[stateKey];
  const sprite = useSprite({
    id: "taurus",
    url,
    x,
    y,
    width: 70,
    height: 70,
    transparentColor: [0, 128, 128],
  });
  useDrawImage(elementRef.current, sprite);

  return (
    <canvas
      {...props}
      name="taurus"
      ref={elementRef}
      width={70}
      height={80}
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  );
};
