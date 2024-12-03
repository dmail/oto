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
import { Taurus } from "./enemy/taurus.jsx";
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

  const [enemyHp, enemyHpSetter] = useState(100);
  const [enemyDamage, enemyDamageSetter] = useState(null);
  const decreaseEnemyHp = useCallback((value) => {
    enemyHpSetter((hp) => hp - value);
  }, []);
  const [enemyHpMax] = useState(100);
  const [heroHp, heroHpSetter] = useState(40);
  const [heroDamage, heroDamageSetter] = useState(null);
  const decreaseHeroHp = useCallback((value) => {
    heroHpSetter((hp) => hp - value);
  }, []);
  const [heroMaxHp] = useState(40);

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
      x: 25,
    },
    to: {
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
    enemyDamageSetter(25);
    await Promise.all([playEnemyDamage(), moveBackToPositionPromise]);
    enemyDamageSetter(null);
    decreaseEnemyHp(25);
    // here we could display a message saying what attack enemy performs
    await new Promise((resolve) => setTimeout(resolve, 150));
    await playEnemyGlow();
    await playPartyMemberHit();
    await new Promise((resolve) => setTimeout(resolve, 150));
    heroDamageSetter(15);
    await playPartyMemberDamage();
    heroDamageSetter(null);
    decreaseHeroHp(15);
    turnStateRef.current = "idle";
  };

  return (
    <div>
      <div
        name="screen"
        style={{ position: "relative", width: "400px", height: "300px" }}
        onClick={() => {
          if (turnStateRef.current === "idle" && !pausedSignal.value) {
            startTurn();
          }
        }}
      >
        <Box name="game" height="85%" width="100%">
          <Box name="background" height="100%" width="100%">
            <MountainAndSkyBattleBackground />
            <WhiteCurtain visible={whiteCurtain} />
          </Box>
          <Box
            name="top_ui"
            height="20%"
            width="100%"
            y="start"
            style={{
              background: "blue",
              opacity: 0.5,
            }}
          ></Box>
          <Box name="enemy_box" height="40%" x="center" y="20%">
            <Taurus
              elementRef={enemyElementRef}
              hp={enemyHp}
              hpMax={enemyHpMax}
            />
            <Box
              name="weapon_box"
              visible={weaponIsVisible}
              x="center"
              y="center"
              height="50%"
            >
              <SwordA elementRef={weaponElementRef} />
            </Box>
            <Digits
              name="enemy_digits"
              elementRef={enemyDigitsElementRef}
              visible={enemyDamage !== null}
              x="center"
              y="center"
            >
              {enemyDamage}
            </Digits>
          </Box>
          <Box name="hero_box" height="10%" x="center" y="70%">
            <Benjamin
              elementRef={heroElementRef}
              direction="top"
              activity="walking"
            />
            <Digits
              name="party_member_digits"
              elementRef={heroDigitsElementRef}
              visible={heroDamage !== null}
              x="center"
              y="end"
              // for some reason it's better centered with that
              dx={2}
            >
              {heroDamage}
            </Digits>
          </Box>
          <Box
            name="bottom_ui"
            height="20%"
            width="100%"
            y="end"
            style={{
              background: "blue",
              opacity: 0.5,
            }}
          ></Box>
        </Box>
        <Box
          name="bottom_hud"
          height="15%"
          width="100%"
          y="end"
          style={{
            background: "black",
            padding: "1px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Box
            name="hero_hud"
            height="100%"
            width="50%"
            x="center"
            style={{
              border: "2px solid white",
              padding: "1%",
            }}
          >
            <Box name="lifebar_box" height="80%" width="80%" y="center">
              <Lifebar value={heroHp} max={heroMaxHp} />
            </Box>
            <Box name="weapon_box" x="end" width="20%">
              <SwordAIcon />
            </Box>
          </Box>
        </Box>
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
