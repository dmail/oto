import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "preact/hooks";
import { useCanvasGlowAnimation } from "./animations/use_canvas_glow_animation.js";
import { useDigitsDisplayAnimation } from "./animations/use_digits_display_animation.js";
import { useElementAnimation } from "./animations/use_element_animation.js";
import { usePartyMemberHitAnimation } from "./animations/use_party_member_hit_animation.js";
import appStyleSheet from "./app.css" with { type: "css" };
import { MountainAndSkyBattleBackground } from "./battle_background/battle_backgrounds.jsx";
import { Benjamin } from "./character/benjamin.jsx";
import { Lifebar } from "./components/lifebar/lifebar.jsx";
import { FirstEnemy } from "./enemy/enemies.jsx";
import { SwordA, SwordAIcon } from "./fight/sword_a.jsx";
import { swordASoundUrl } from "./fight/sword_sound_url.js";
import { WhiteCurtain } from "./fight/white_curtain.jsx";
import { useBooleanState } from "./hooks/use_boolean_state.js";
import { useSound } from "./hooks/use_sound.js";
import { PauseDialog } from "./interface/pause_dialog.jsx";
import { Box } from "./layout/box.jsx";
import { pause, pausedSignal, play } from "./signals.js";
import { Digits } from "./text/digits.jsx";

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

  const [playHeroMoveToAct] = useElementAnimation({
    id: "hero_move_to_act",
    elementRef: heroElementRef,
    to: {
      y: -20,
    },
    duration: 200,
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
  });
  const [playPartyMemberMoveBackToPosition] = useElementAnimation({
    id: "party_member_move_back_to_position",
    elementRef: heroElementRef,
    to: {
      y: 0,
    },
    duration: 200,
  });
  const [playEnemyGlow] = useCanvasGlowAnimation({
    id: "enemy_glow",
    elementRef: enemyElementRef,
    from: "black",
    to: "white",
    duration: 300,
    onFinish: useCallback(() => {
      playPartyMemberHit();
    }, []),
  });
  const enemyDigitsElementRef = useRef();
  const heroDigitsElementRef = useRef();
  const [weaponIsVisible, weaponIsVisibleSetter] = useState(false);
  const [enemyDigitsVisible, enemyDigitsVisibleSetter] = useState(false);
  const [heroDigitsVisible, heroDigitsVisibleSetter] = useState(false);
  const [playEnemyDamage] = useDigitsDisplayAnimation({
    elementRef: enemyDigitsElementRef,
    duration: 300,
  });
  const [playPartyMemberHit] = usePartyMemberHitAnimation({
    elementRef: heroElementRef,
    duration: 500,
  });
  const [playPartyMemberDamage] = useDigitsDisplayAnimation({
    elementRef: heroDigitsElementRef,
    duration: 300,
    toY: -1.2,
  });

  const turnStateRef = useRef("idle");
  const startTurn = async () => {
    turnStateRef.current = "running";
    // here we could display a message saying what attack hero performs
    await playHeroMoveToAct();
    showWhiteCurtain();
    swordSound.currentTime = 0.15;
    swordSound.play();
    weaponIsVisibleSetter(true);
    await playWeaponTranslation();
    weaponIsVisibleSetter(false);
    const moveBackToPositionPromise = playPartyMemberMoveBackToPosition();
    await new Promise((resolve) => setTimeout(resolve, 200));
    enemyDigitsVisibleSetter(true);
    await Promise.all([playEnemyDamage(), moveBackToPositionPromise]);
    enemyDigitsVisibleSetter(false);
    // here we could display a message saying what attack enemy performs
    await new Promise((resolve) => setTimeout(resolve, 150));
    await playEnemyGlow();
    await playPartyMemberHit();
    await new Promise((resolve) => setTimeout(resolve, 150));
    heroDigitsVisibleSetter(true);
    await playPartyMemberDamage();
    heroDigitsVisibleSetter(false);
    turnStateRef.current = "idle";
  };

  return (
    <div>
      <div
        name="screen"
        style={{ position: "relative", width: "300px" }}
        onClick={() => {
          if (turnStateRef.current === "idle" && !pausedSignal.value) {
            startTurn();
          }
        }}
      >
        <div style={{ position: "relative", height: "260px", width: "100%" }}>
          <div
            name="background"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
            }}
          >
            <MountainAndSkyBattleBackground />
            <WhiteCurtain visible={whiteCurtain} />
          </div>
          <div
            name="front"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
            }}
          >
            <Box name="enemy_box" height={100} width={100} x="center" y={50}>
              <FirstEnemy elementRef={enemyElementRef} />
              <Box
                x="center"
                y="center"
                name="weapon_box"
                visible={weaponIsVisible}
                width={60}
                height={60}
              >
                <SwordA elementRef={weaponElementRef} />
              </Box>
              <Digits
                name="enemy_digits"
                elementRef={enemyDigitsElementRef}
                visible={enemyDigitsVisible}
                x="center"
                y="center"
              >
                14000
              </Digits>
            </Box>
            <Box name="hero_box" width={25} height={25} x="center" y={170}>
              <Benjamin
                elementRef={heroElementRef}
                direction="top"
                activity="walking"
              />
              <Digits
                name="party_member_digits"
                elementRef={heroDigitsElementRef}
                visible={heroDigitsVisible}
                x="center"
                y="end"
                // for some reason it's better centered with that
                dx={2}
              >
                26
              </Digits>
            </Box>
          </div>
        </div>
        <div
          name="bottom_hud"
          style={{
            position: "relative",
            height: "50px",
            width: "100%",
            background: "black",
            padding: "1px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            name="hero_hud"
            style={{
              border: "2px solid white",
              padding: "2px",
              height: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                height: "100%",
                alignItems: "center",
                padding: "4px",
              }}
            >
              <div style={{ height: "20px", width: "120px" }}>
                <Lifebar value={40} max={40} />
              </div>
              <div style={{ width: "48px", height: "48px" }}>
                <SwordAIcon />
              </div>
            </div>
          </div>
        </div>
        <PauseDialog visible={pausedSignal.value} />
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
