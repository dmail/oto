import { EASING } from "animation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "preact/hooks";
import { useCanvasGlowAnimation } from "./animations/use_canvas_glow_animation.js";
import { useElementAnimation } from "./animations/use_element_animation.js";
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
import { pause, pausedSignal, play } from "./signals.js";

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

  const [partyMemberActionStep, partyMemberActionStepSetter] = useState("idle");
  const partyMemberIsIdle = partyMemberActionStep === "idle";
  const partyMemberIsMovingToAct = partyMemberActionStep === "move_to_act";
  const partyMemberIsActing = partyMemberActionStep === "acting";
  const partyMemberIsMovingBackToPosition =
    partyMemberActionStep === "move_back_to_position";
  const startPartyMemberTurn = useCallback(() => {
    partyMemberActionStepSetter("move_to_act");
  }, []);
  const startPartyMemberAction = useCallback(() => {
    partyMemberActionStepSetter("acting");
  }, []);
  const endPartyMemberAction = useCallback(() => {
    partyMemberActionStepSetter("move_back_to_position");
  }, []);
  const endPartyMemberTurn = useCallback(() => {
    partyMemberActionStepSetter("idle");
  }, []);
  const [enemyActionStep, enemyActionStepSetter] = useState("idle");
  const enemyIsActing = enemyActionStep === "acting";
  const startEnemyTurn = useCallback(() => {
    enemyActionStepSetter("acting");
  }, []);
  const endEnemyTurn = useCallback(() => {
    enemyActionStepSetter("idle");
  }, []);

  const [playHeroMoveToAct] = useElementAnimation({
    id: "hero_move_to_act",
    elementRef: heroElementRef,
    to: {
      y: -20,
    },
    duration: 200,
    onCancel: endPartyMemberTurn,
    onFinish: startPartyMemberAction,
  });
  useLayoutEffect(() => {
    if (partyMemberIsMovingToAct) {
      playHeroMoveToAct();
    }
  }, [partyMemberIsMovingToAct, playHeroMoveToAct]);
  const [playHeroMoveBackToPosition] = useElementAnimation({
    id: "hero_move_back_to_position",
    elementRef: heroElementRef,
    to: {
      y: 0,
    },
    duration: 200,
    onCancel: endPartyMemberTurn,
    onFinish: () => {
      endPartyMemberTurn();
      startEnemyTurn();
    },
  });
  useLayoutEffect(() => {
    if (partyMemberIsMovingBackToPosition) {
      playHeroMoveBackToPosition();
    }
  }, [partyMemberIsMovingBackToPosition, playHeroMoveBackToPosition]);

  const [playEnemyGlow] = useCanvasGlowAnimation({
    id: "enemy_glow",
    elementRef: enemyElementRef,
    from: "black",
    to: "white",
    duration: 300,
    onFinish: () => {
      playHeroReceiveDamage();
    },
  });
  useLayoutEffect(() => {
    if (enemyIsActing) {
      playEnemyGlow();
    }
  }, [enemyIsActing, playEnemyGlow]);

  const [playHeroReceiveDamage] = useElementAnimation({
    id: "hero_receive_damage",
    elementRef: heroElementRef,
    to: {
      y: -20,
    },
    duration: 3000,
    easing: EASING.EASE_OUT_ELASTIC,
    onFinish: () => {
      endEnemyTurn();
    },
  });

  const swordSound = useSound({ url: swordASoundUrl, volume: 0.25 });
  const [whiteCurtain, showWhiteCurtain, hideWhiteCurtain] = useBooleanState();
  useEffect(() => {
    const timeout = setTimeout(hideWhiteCurtain, 150);
    return () => {
      clearTimeout(timeout);
    };
  }, [whiteCurtain]);

  const [playWeaponTranslation] = useElementAnimation({
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
    onFinish: endPartyMemberAction,
  });
  useLayoutEffect(() => {
    if (partyMemberIsActing) {
      playWeaponTranslation();
    }
  }, [partyMemberIsActing, playWeaponTranslation]);

  return (
    <div>
      <div
        className="app"
        style={{ position: "relative", height: "200px", width: "300px" }}
        onClick={() => {
          if (partyMemberIsIdle && !pausedSignal.value) {
            startPartyMemberTurn();
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
            <Box
              name="weapon_box"
              visible={partyMemberIsActing}
              width={60}
              height={60}
            >
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
      <div>
        <button
          onClick={() => {
            if (pausedSignal.value) {
              play();
            } else {
              pause();
            }
          }}
        >
          {pausedSignal.value ? "play" : "pause"}
        </button>
      </div>
    </div>
  );
};
