import { useLayoutEffect, useState } from "preact/hooks";
import { Animation, translateY } from "./animation/animation.jsx";
import appStyleSheet from "./app.css" with { type: "css" };
import { MountainAndSkyBattleBackground } from "./battle_background/battle_backgrounds.jsx";
import { Benjamin } from "./character/benjamin.jsx";
import "./custom_elements_redefine.js";
import { FirstEnemy } from "./enemy/enemies.jsx";
import { SwordA } from "./fight/sword_a.jsx";
import { swordASoundUrl } from "./fight/sword_sound_url.js";
import { WhiteCurtain } from "./fight/white_curtain.jsx";
import { useSound } from "./hooks/use_sound.js";
import { Box } from "./layout/box.jsx";

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
  const [whiteCurtain, whiteCurtainSetter] = useState(false);

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
        {whiteCurtain && (
          <WhiteCurtain
            style={{ position: "absolute", left: 0, top: 0 }}
            onFinish={() => {
              whiteCurtainSetter(false);
            }}
          />
        )}
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
                  whiteCurtainSetter(true);
                  swordSound.currentTime = 0.15;
                  swordSound.play();
                },
                onFinish: () => {
                  // backgroundBlinkSetter(false);
                  // swordSound.pause();
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
