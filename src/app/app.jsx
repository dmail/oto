import { glow, useElementAnimation } from "animation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
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
  const heroElementRef = useRef();
  const weaponElementRef = useRef();
  const enemyElementRef = useRef();

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
  const [enemyActionStep, enemyActionStepSetter] = useState("idle");
  const enemyIsActing = enemyActionStep === "acting";
  const startEnemyAction = useCallback(() => {
    enemyActionStepSetter("acting");
  }, []);
  const endEnemyAction = useCallback(() => {
    enemyActionStepSetter("idle");
  }, []);

  const heroMoveToActAnimation = useElementAnimation({
    id: "hero_move_to_act",
    elementRef: heroElementRef,
    to: {
      y: -20,
    },
    duration: 200,
    onCancel: goIdle,
    onFinish: readyToAct,
  });
  useLayoutEffect(() => {
    if (isMovingToAct) {
      heroMoveToActAnimation.play();
    }
  }, [isMovingToAct]);
  const heroMoveBackToPositionAnimation = useElementAnimation({
    id: "hero_move_back_to_position",
    elementRef: heroElementRef,
    to: {
      y: 0,
    },
    duration: 200,
    onCancel: goIdle,
    onFinish: () => {
      goIdle();
      startEnemyAction();
    },
  });
  useLayoutEffect(() => {
    if (isMovingBackToPosition) {
      heroMoveBackToPositionAnimation.play();
    }
  }, [isMovingBackToPosition]);

  const enemyGlowAnimation = useCanvasGlowAnimation({
    id: "enemy_glow",
    canvasRef: enemyElementRef,
    onFinish: endEnemyAction,
  });
  useLayoutEffect(() => {
    if (enemyIsActing) {
      enemyGlowAnimation.play();
    }
  }, [enemyIsActing]);

  const swordSound = useSound({ url: swordASoundUrl, volume: 0.25 });
  const [whiteCurtain, showWhiteCurtain, hideWhiteCurtain] = useBooleanState();
  useEffect(() => {
    const timeout = setTimeout(hideWhiteCurtain, 150);
    return () => {
      clearTimeout(timeout);
    };
  }, [whiteCurtain]);

  const weaponTranslation = useElementAnimation({
    id: "weapon_translation",
    elementRef: weaponElementRef,
    from: {
      mirrorX: true,
      x: 25,
    },
    to: {
      mirrorX: true,
      x: -15,
    },
    duration: 200,
    onStart: useCallback(() => {
      showWhiteCurtain();
      swordSound.currentTime = 0.15;
      swordSound.play();
    }, []),
    onFinish: finishAction,
  });
  useLayoutEffect(() => {
    if (isActing) {
      weaponTranslation.play();
    }
  }, [weaponTranslation, isActing]);

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
        <WhiteCurtain visible={whiteCurtain} />
      </div>
      <div
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      >
        <Box name="enemy_box" height={100} width={100} x="center" y={26}>
          <FirstEnemy elementRef={enemyElementRef} />
          <Box name="weapon_box" visible={isActing} width={60} height={60}>
            <SwordA elementRef={weaponElementRef} />
          </Box>
        </Box>
        <Box name="hero_box" width={25} height={25} x="center" y={140}>
          <Benjamin
            elementRef={heroElementRef}
            direction="top"
            activity="walking"
          />
        </Box>
      </div>
    </div>
  );
};

const useCanvasGlowAnimation = ({ canvasRef, onFinish }) => {
  const animRef = useRef();
  const play = useCallback(() => {
    const glowAnimation = glow(canvasRef.current);
    animRef.current = glowAnimation;
    glowAnimation.onfinish = onFinish;
  }, [onFinish]);

  const cancel = useCallback(() => {
    if (animRef.current) {
      animRef.current.cancel();
    }
  }, []);

  useLayoutEffect(() => {
    return cancel;
  }, []);

  return useMemo(() => {
    return { play, cancel };
  }, []);
};
