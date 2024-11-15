import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "preact/hooks";
import { Animation } from "./animation/animation.jsx";
import appStyleSheet from "./app.css" with { type: "css" };
import { MountainAndSkyBattleBackground } from "./battle_background/battle_backgrounds.jsx";
import { Benjamin } from "./character/benjamin.jsx";
import "./custom_elements_redefine.js";
import { FirstEnemy } from "./enemy/enemies.jsx";
import { SwordA } from "./fight/sword_a.jsx";
import { swordASoundUrl } from "./fight/sword_sound_url.js";
import { WhiteCurtain } from "./fight/white_curtain.jsx";
import { useBooleanState } from "./hooks/use_boolean_state.js";
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

  const [characterActionStep, characterActionStepSetter] = useState("idle");
  const isIdle = characterActionStep === "idle";
  const isMovingToAct = characterActionStep === "move_to_act";
  const isActing = characterActionStep === "acting";
  const isMovingBackToPosition =
    characterActionStep === "move_back_to_position";
  const startAction = useCallback(() => {
    characterActionStepSetter("move_to_act");
  }, []);
  const readyToAct = useCallback(() => {
    characterActionStepSetter("acting");
  }, []);
  const finishAction = useCallback(() => {
    characterActionStepSetter("move_back_to_position");
  }, []);
  const goIdle = useCallback(() => {
    characterActionStepSetter("idle");
  }, []);

  const swordSound = useSound({ url: swordASoundUrl });
  // const [whiteCurtain, showWhiteCurtain, hideWhiteCurtain] = useBooleanState();
  // useEffect(() => {
  //   const timeout = setTimeout(hideWhiteCurtain, 150);
  //   return () => {
  //     clearTimeout(timeout);
  //   };
  // }, [whiteCurtain]);

  const startActionAnimationProps = {
    to: {
      y: -20,
    },
    duration: 200,
    onCancel: goIdle,
    onFinish: readyToAct,
  };
  const moveBackToPositionAnimationProps = {
    to: {
      y: 0,
    },
    duration: 200,
    onCancel: goIdle,
    onFinish: goIdle,
  };
  const heroAnimationProps = isMovingToAct
    ? startActionAnimationProps
    : isMovingBackToPosition
      ? moveBackToPositionAnimationProps
      : {};

  return (
    <div
      className="app"
      style={{ position: "relative", height: "200px", width: "300px" }}
      onClick={() => {
        if (isIdle) {
          startAction();
        }
      }}
    >
      <div
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      >
        <MountainAndSkyBattleBackground />
        {/* {whiteCurtain && (
          <WhiteCurtain style={{ position: "absolute", left: 0, top: 0 }} />
        )} */}
      </div>
      <div
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      >
        <Box height={100} width={100} x="center" y={26}>
          <FirstEnemy />
          <Box
            style={{ display: isActing ? "block" : "none" }}
            width={60}
            height={60}
          >
            <Animation
              id="weapon_animation"
              enabled={isActing}
              from={{
                scaleX: -1,
                x: 20,
                angle: 10,
              }}
              to={{
                scaleX: -1,
                x: 0,
                angle: -10,
              }}
              duration={200}
              onStart={useCallback(() => {
                console.log("start animation for sword");
                // showWhiteCurtain();
                swordSound.currentTime = 0.15;
                swordSound.play();
              }, [])}
              onFinish={finishAction}
            >
              <SwordA />
            </Animation>
          </Box>
        </Box>

        <Box width={25} height={25} x="center" y={140}>
          <Animation {...heroAnimationProps}>
            <Benjamin direction="top" activity="walking" />
          </Animation>
        </Box>
      </div>
    </div>
  );
};
