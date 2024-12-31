const enemySpritesheetUrl = new URL("./enemy_sprite.png", import.meta.url);
const hpAbove = (limit) => {
  return ({ hp, hpMax }) => {
    const hpLimit =
      typeof limit === "string" ? (parseFloat(limit) / 100) * hpMax : limit;
    return hp > hpLimit;
  };
};

export const taurus = {
  name: "Taurus",
  attributes: {
    hp: 55,
    attack: 10,
    defense: 0,
    speed: 2,
  },
  transparentColor: [0, 202, 202],
  states: {
    full_life: {
      conditions: {
        hp: hpAbove("80%"),
      },
      url: enemySpritesheetUrl,
      x: 450,
      y: 100,
    },
    mid_life: {
      conditions: {
        hp: hpAbove("25%"),
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
