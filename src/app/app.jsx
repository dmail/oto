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
import { Spacing } from "./layout/spacing.jsx";
import { pause, pausedSignal, play } from "./signals.js";
import { Digits } from "./text/digits.jsx";
import { Text } from "./text/text.jsx";

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
      <Zone
        rows
        name="screen"
        width="400"
        height="300"
        onClick={() => {
          if (turnStateRef.current === "idle" && !pausedSignal.value) {
            startTurn();
          }
        }}
      >
        <Zone rows name="game" height="85%" width="100%">
          <Box name="background" height="100%" width="100%">
            <MountainAndSkyBattleBackground />
            <WhiteCurtain visible={whiteCurtain} />
          </Box>
          <Zone name="top_ui" height="20%" width="100%">
            <Zone
              name="text_container"
              x="center"
              y="center"
              width="fit-content"
              height="fit-content"
              style={{
                background: "black",
                border: "5px solid white",
                borderRadius: "10%",
              }}
            >
              <Spacing size="10">
                <Text x="center" y="start" color="white">
                  Taurus
                </Text>
              </Spacing>
            </Zone>
          </Zone>
          <Zone name="enemy_box" height="40%" x="center">
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
            <Box
              name="enemy_digits_box"
              elementRef={enemyDigitsElementRef}
              visible={enemyDamage !== null}
              width="100%"
              height="100%"
            >
              <Box
                x="center"
                y="center"
                width="fit-content"
                height="fit-content"
              >
                <Digits name="enemy_digits">{enemyDamage}</Digits>
              </Box>
            </Box>
          </Zone>
          <Zone name="front_line" height="15%" width="100%"></Zone>
          <Zone name="hero_box" height="10%" x="center">
            <Benjamin
              elementRef={heroElementRef}
              direction="top"
              activity="walking"
            />
            <Box
              name="hero_digits_box"
              elementRef={heroDigitsElementRef}
              visible={heroDamage !== null}
              width="100%"
              height="100%"
            >
              <Box x="center" y="end" width="fit-content" height="fit-content">
                <Digits
                  name="hero_digits"
                  // for some reason it's better centered with that
                  dx={2}
                >
                  {heroDamage}
                </Digits>
              </Box>
            </Box>
          </Zone>
          <Zone
            name="bottom_ui"
            height="15%"
            width="100%"
            y="end"
            style={{
              background: "blue",
              opacity: 0.5,
            }}
          ></Zone>
        </Zone>
        <Zone
          name="bottom_hud"
          rows
          height="15%"
          width="100%"
          y="end"
          style={{
            background: "black",
          }}
          spacing="xss"
        >
          <Zone
            name="hero_hud"
            spacing="s"
            width="50%"
            style={{
              border: "2px solid white",
            }}
          >
            <Zone name="lifebar_box" height="80%" width="80%" y="center">
              <Lifebar value={heroHp} max={heroMaxHp} />
            </Zone>
            <Zone name="weapon_box" width="20%">
              <SwordAIcon />
            </Zone>
          </Zone>
          <Zone
            name="ally_hud"
            width="50%"
            style={{
              border: "2px solid white",
            }}
          >
            Empty
          </Zone>
        </Zone>
        <PauseDialog visible={pausedSignal.value} />
      </Zone>
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

// to be renamed box later on
// and Box will be renamed Zone
const Zone = ({
  elementRef = useRef(),
  rows = false,
  children,
  spacing,
  spacingTop,
  spacingLeft,
  spacingRight,
  spacingBottom,
  width = rows ? "100%" : "auto",
  height = rows ? "fit-content" : "100%",
  aspectRatio = 1,
  x = "start",
  y = "start",
  ...props
}) => {
  useLayoutEffect(() => {
    const element = elementRef.current;
    if (height === "auto") {
      const width = height * aspectRatio;
      element.style.width = `${width}px`;
    }
    if (width === "auto") {
      const height = width / aspectRatio;
      element.style.height = `${height}px`;
    }
  }, [width, height, aspectRatio]);

  const style = {
    ...props.style,
    display: "inline-flex",
    flexDirection: rows ? "row" : "column",
    position: "relative",
    width: isFinite(width) ? `${width}px` : width === "..." ? undefined : width,
    height: isFinite(height) ? `${height}px` : height,
    flexWrap: "wrap",
    minWidth: height === "..." ? 0 : undefined,
    minHeight: width === "..." ? 0 : undefined,
  };
  if (spacing) {
    style.padding =
      typeof spacing === "number" ? spacing : SPACING_SIZES[spacing];
  }
  if (spacingTop) {
    style.paddingTop =
      typeof spacingTop === "number" ? spacingTop : SPACING_SIZES[spacingTop];
  }
  if (spacingLeft) {
    style.paddingLeft =
      typeof spacingLeft === "number"
        ? spacingLeft
        : SPACING_SIZES[spacingLeft];
  }
  if (spacingRight) {
    style.paddingRight =
      typeof spacingRight === "number"
        ? spacingRight
        : SPACING_SIZES[spacingRight];
  }
  if (spacingBottom) {
    style.paddingBottom =
      typeof spacingBottom === "number"
        ? spacingBottom
        : SPACING_SIZES[spacingBottom];
  }
  if (height === "..." || width === "...") {
    style.minWidth = 0;
    style.minHeight = 0;
    style.flexGrow = 1;
  }
  style.alignSelf = {
    start: "flex-start",
    center: "center",
    end: "flex-end",
  }[y];
  if (x === "center") {
    style.marginLeft = "auto";
    style.marginRight = "auto";
  }
  if (y === "center") {
    style.marginTop = "auto";
    style.marginBottom = "auto";
  }
  return (
    <div {...props} ref={elementRef} style={style}>
      {children}
    </div>
  );
};

const SPACING_SIZES = {
  xxl: 100,
  xl: 50,
  l: 20,
  md: 10,
  s: 5,
  xs: 2,
  xxs: 1,
};
