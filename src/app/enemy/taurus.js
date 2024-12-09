const enemySpritesheetUrl = new URL("./enemy_sprite.png", import.meta.url);
const hpAbove =
  (percentage) =>
  ({ hp, hpMax }) => {
    const hpRatio = hp / hpMax;
    const ratio = percentage / 100;
    return hpRatio > ratio;
  };

export const taurus = {
  name: "Taurus",
  hp: 100,
  transparentColor: [0, 202, 202],
  states: {
    full_life: {
      conditions: {
        hp: hpAbove(50),
      },
      url: enemySpritesheetUrl,
      x: 450,
      y: 100,
    },
    mid_life: {
      conditions: {
        hp: hpAbove(25),
      },
      url: enemySpritesheetUrl,
      x: 515,
      y: 100,
    },
    low_life: {
      conditions: {
        hp: () => true,
      },
      url: enemySpritesheetUrl,
      x: 580,
      y: 100,
    },
  },
};
