import { useLayoutEffect, useState } from "preact/hooks";
import appStyleSheet from "./app.css" with { type: "css" };
import "./custom_elements_redefine.js";
import { MountainAndSkyBattleBackground } from "./battle_background/battle_backgrounds.jsx";
import { FirstEnemy } from "./enemy/enemies.jsx";
import { Benjamin } from "./character/benjamin.jsx";
import { Box } from "./layout/box.jsx";
import { Animation, translateY } from "./animation/animation.jsx";

export const App = () => {
  useLayoutEffect(() => {
    document.adoptedStyleSheets = [
      ...document.adoptedStyleSheets,
      appStyleSheet,
    ];
    return () => {
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
        (s) => s !== appStyleSheet,
      );
    };
  }, []);

  const [moveToAttack, moveToAttackSetter] = useState(false);
  const [moveBackAfterAttack, moveBackAfterAttackSetter] = useState(false);

  return (
    <div
      className="app"
      style={{ position: "relative", height: "200px", width: "300px" }}
      onClick={() => {
        moveToAttackSetter(true);
      }}
    >
      <div
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      >
        <MountainAndSkyBattleBackground />
      </div>
      <div
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      >
        <Box height={100} width={100} x="center" y={26}>
          <FirstEnemy />
        </Box>
        <Animation
          options={
            moveToAttack
              ? {
                  ...translateY(-20),
                  duration: 200,
                  onCancel: () => {
                    moveToAttackSetter(false);
                  },
                  onFinish: () => {
                    moveToAttackSetter(false);
                    alert("do the attack");
                    moveBackAfterAttackSetter(true);
                  },
                }
              : moveBackAfterAttack
                ? {
                    ...translateY(0),
                    duration: 200,
                    onCancel: () => {
                      moveBackAfterAttackSetter(false);
                    },
                    onFinish: () => {
                      moveBackAfterAttackSetter(false);
                    },
                  }
                : null
          }
        >
          <Box width={25} height={25} x="center" y={140}>
            <Benjamin direction="top" activity="walking" />
          </Box>
        </Animation>
      </div>
    </div>
  );
};
