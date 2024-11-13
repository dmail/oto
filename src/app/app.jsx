import { useLayoutEffect, useState } from "preact/hooks";
import appStyleSheet from "./app.css" with { type: "css" };
import "./custom_elements_redefine.js";
import { MountainAndSkyBattleBackground } from "./battle_background/battle_backgrounds.jsx";
import { FirstEnemy } from "./enemy/enemies.jsx";
import { Benjamin } from "./character/benjamin.jsx";
import { Box } from "./layout/box.jsx";
import { Animation, translateY } from "./animation/animation.jsx";
import { SwordA } from "./fight/sword_a.jsx";
import { swordASoundUrl } from "./fight/sword_sound_url.js";
import { useSound } from "./audio/sound.jsx";

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
  const [attack, attackSetter] = useState(false);
  const [moveBackAfterAttack, moveBackAfterAttackSetter] = useState(false);

  const swordSound = useSound({ url: swordASoundUrl });

  return (
    <div
      className="app"
      style={{ position: "relative", height: "200px", width: "300px" }}
      onClick={() => {
        if (!attack && !moveBackAfterAttack) {
          moveToAttackSetter(true);
        }
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
          {attack && (
            <Animation
              options={{
                steps: [
                  {
                    transform: `scaleX(-1) translateX(20px) rotate(10deg)`,
                  },
                  {
                    transform: `scaleX(-1) translateX(0px) rotate(-10deg)`,
                  },
                ],
                duration: 200,
                onStart: () => {
                  swordSound.play();
                },
                onFinish: () => {
                  attackSetter(false);
                  moveBackAfterAttackSetter(true);
                },
              }}
            >
              <Box width={60} height={60}>
                <SwordA />
              </Box>
            </Animation>
          )}
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
                    attackSetter(true);
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
