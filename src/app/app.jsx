import { computed, signal } from "@preact/signals";
import { forwardRef } from "preact/compat";
import {
  useCallback,
  useEffect,
  useImperativeHandle,
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
import { Message } from "./components/message/message.jsx";
import { Enemy } from "./enemy/enemy.jsx";
import { taurus } from "./enemy/taurus.js";
import { MenuFight } from "./fight/menu_fight.jsx";
import { Selector } from "./fight/selector.jsx";
import { SwordA, SwordAIcon } from "./fight/sword_a.jsx";
import { swordASoundUrl } from "./fight/sword_sound_url.js";
import { WhiteCurtain } from "./fight/white_curtain.jsx";
import { useBooleanState } from "./hooks/use_boolean_state.js";
import { useKeyEffect } from "./hooks/use_key_effect.js";
import { useSound } from "./hooks/use_sound.js";
import { PauseDialog } from "./interface/pause_dialog.jsx";
import { Box } from "./layout/box.jsx";
import { pause, pausedSignal, play } from "./signals.js";
import { Digits } from "./text/digits.jsx";

// const enemiesSignal = signal([taurus]);
const enemySignal = signal(taurus);
const enemyImageUrlSignal = computed(() => enemySignal.value.url);
const enemyImageTransparentColorSignal = computed(
  () => enemySignal.value.transparentColor,
);
const enemyNameSignal = computed(() => enemySignal.value.name);
const enemyHpMaxSignal = computed(() => enemySignal.value.hp);
const enmyStatesSignal = computed(() => enemySignal.value.states);

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
  const enemyHpMax = enemyHpMaxSignal.value;
  const enemyStates = enmyStatesSignal.value;
  const oponentRef = useRef();
  const [enemyHp, enemyHpSetter] = useState(enemyHpMax);
  const decreaseEnemyHp = useCallback((value) => {
    enemyHpSetter((hp) => hp - value);
  }, []);
  const heroRef = useRef();

  const [heroHp, heroHpSetter] = useState(40);
  const decreaseHeroHp = useCallback((value) => {
    heroHpSetter((hp) => hp - value);
  }, []);
  const [heroMaxHp] = useState(40);

  const swordSound = useSound({ url: swordASoundUrl, volume: 0.25 });
  const [whiteCurtain, showWhiteCurtain, hideWhiteCurtain] = useBooleanState();
  useEffect(() => {
    const timeout = setTimeout(hideWhiteCurtain, 150);
    return () => {
      clearTimeout(timeout);
    };
  }, [whiteCurtain]);

  const [turnState, turnStateSetter] = useState("");
  useKeyEffect({
    Escape: useCallback(() => {
      if (turnState === "player_is_selecting_target") {
        turnStateSetter("");
      }
    }, [turnState]),
  });

  const startTurn = async () => {
    turnStateSetter("running");
    // here we could display a message saying what attack hero performs
    await heroRef.current.moveToAct();
    showWhiteCurtain();
    swordSound.currentTime = 0.15;
    swordSound.play();
    await oponentRef.current.playWeaponAnimation();
    const moveBackToPositionPromise = heroRef.current.moveBackToPosition();
    await new Promise((resolve) => setTimeout(resolve, 200));
    await Promise.all([
      oponentRef.current.displayDamage(25),
      moveBackToPositionPromise,
    ]);
    decreaseEnemyHp(25);
    // here we could display a message saying what attack enemy performs
    await new Promise((resolve) => setTimeout(resolve, 150));
    await oponentRef.current.glow();
    await heroRef.current.recoilAfterHit();
    await new Promise((resolve) => setTimeout(resolve, 150));
    await heroRef.current.displayDamage(15);
    decreaseHeroHp(15);
    turnStateSetter("");
  };

  return (
    <div style="font-size: 16px;">
      <Box vertical name="screen" width="400" height="400">
        <Box vertical name="game" width="100%" height="...">
          <Box name="background" absolute width="100%" height="100%">
            <MountainAndSkyBattleBackground />
            <WhiteCurtain visible={whiteCurtain} />
          </Box>
          <Box name="enemies_box" width="100%" height="55%">
            <Opponent
              ref={oponentRef}
              turnState={turnState}
              enemyHp={enemyHp}
              enemyHpMax={enemyHpMax}
              enemyStates={enemyStates}
              onSelect={() => {
                startTurn();
              }}
            />
          </Box>
          <Box name="front_line" width="100%" height="10%"></Box>
          <Box name="allies_box" height="10%" width="100%">
            <Ally ref={heroRef} />
          </Box>
          <Box
            name="bottom_ui"
            width="100%"
            height="..."
            contentX="center"
            contentY="end"
            innerSpacingBottom="0.5em"
            hidden={turnState !== ""}
          >
            <MenuFight
              onAttack={() => {
                if (turnState === "" && !pausedSignal.value) {
                  turnStateSetter("player_is_selecting_target");
                }
              }}
            ></MenuFight>
          </Box>
        </Box>
        <Box
          name="bottom_hud"
          width="100%"
          height="15%"
          maxHeight="50"
          y="end"
          innerSpacing="xss"
          style={{
            background: "black",
          }}
        >
          <Box
            name="hero_hud"
            width="50%"
            height="100%"
            maxHeight="100%"
            innerSpacing="s"
            style={{
              border: "2px solid white",
            }}
          >
            <Box name="lifebar_box" ratio="120/100" width="80%" y="center">
              <Lifebar value={heroHp} max={heroMaxHp} />
            </Box>
            <Box name="weapon_box" ratio="1/1" width="20%" x="end" y="center">
              <SwordAIcon />
            </Box>
          </Box>
          <Box
            name="ally_hud"
            width="50%"
            height="100%"
            style={{
              border: "2px solid white",
            }}
          >
            Empty
          </Box>
        </Box>
        <PauseDialog visible={pausedSignal.value} />
      </Box>
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

const Ally = forwardRef((props, ref) => {
  const elementRef = useRef();
  const [heroDamage, heroDamageSetter] = useState(null);

  const [moveToAct] = useElementAnimation({
    id: "ally_move_to_act",
    elementRef,
    to: {
      y: -20,
    },
    duration: 200,
  });
  const [moveBackToPosition] = useElementAnimation({
    id: "ally_move_back_to_position",
    elementRef,
    to: {
      y: 0,
    },
    duration: 200,
  });

  const heroDigitsElementRef = useRef();
  const [recoilAfterHit] = usePartyMemberHitAnimation({
    elementRef,
    duration: 500,
  });
  const [displayDamage] = useDigitsDisplayAnimation({
    elementRef: heroDigitsElementRef,
    duration: 300,
    toY: -1.2,
  });

  useImperativeHandle(ref, () => {
    return {
      moveToAct,
      moveBackToPosition,
      recoilAfterHit,
      displayDamage: async (value) => {
        heroDamageSetter(value);
        await displayDamage();
        heroDamageSetter(null);
      },
    };
  });

  return (
    <Box name="ally_box" ratio="1/1" height="100%" x="center">
      <Benjamin elementRef={elementRef} direction="top" activity="walking" />
      <Box
        name="hero_digits_box"
        absolute
        elementRef={heroDigitsElementRef}
        hidden={heroDamage === null}
        width="100%"
        height="100%"
      >
        <Box x="center" y="end">
          <Digits
            name="hero_digits"
            dx={2} // for some reason it's better centered with that
          >
            {heroDamage}
          </Digits>
        </Box>
      </Box>
    </Box>
  );
});

const Opponent = forwardRef(
  (
    {
      // name,
      turnState,
      enemyHp,
      enemyHpMax,
      enemyStates,
      onSelect,
    },
    ref,
  ) => {
    const elementRef = useRef();
    const [glow] = useCanvasGlowAnimation({
      id: "enemy_glow",
      elementRef,
      from: "black",
      to: "white",
      duration: 300,
    });

    const enemyDigitsElementRef = useRef();
    const [displayDamage] = useDigitsDisplayAnimation({
      elementRef: enemyDigitsElementRef,
      duration: 300,
    });
    const weaponElementRef = useRef();
    const [playWeaponAnimation] = useElementAnimation({
      id: "weapon_animation",
      elementRef: weaponElementRef,
      from: {
        x: 25,
      },
      to: {
        x: -15,
      },
      duration: 200,
    });
    const [weaponIsVisible, weaponIsVisibleSetter] = useState(false);

    const enemyStateKey = enemyStates
      ? Object.keys(enemyStates).find((key) => {
          const { conditions } = enemyStates[key];
          if (
            conditions.hp &&
            conditions.hp({ hp: enemyHp, hpMax: enemyHpMax })
          ) {
            return true;
          }
          return false;
        })
      : null;
    const enemyPropsFromState = enemyStateKey ? enemyStates[enemyStateKey] : {};
    const enemyImageUrl = enemyImageUrlSignal.value;
    const enemyImageTransparentColor = enemyImageTransparentColorSignal.value;

    const [enemyDamage, enemyDamageSetter] = useState(null);

    useImperativeHandle(ref, () => {
      return {
        glow,
        playWeaponAnimation: async () => {
          weaponIsVisibleSetter(true);
          await playWeaponAnimation();
          weaponIsVisibleSetter(false);
        },
        displayDamage: async (value) => {
          enemyDamageSetter(value);
          await displayDamage();
          enemyDamageSetter(null);
        },
      };
    });

    return (
      <Box
        vertical
        name="enemy_container_box"
        width="100%"
        height="100%"
        x="center"
      >
        <Box name="top_ui" width="100%" innerSpacing="0.5em">
          <Message hidden={turnState !== ""} innerSpacing="0.7em">
            {enemyNameSignal.value}
          </Message>
        </Box>
        <Box
          name="enemy_box"
          ratio="1/1"
          height="..."
          x="center"
          innerSpacing="10"
        >
          <Selector
            hidden={turnState !== "player_is_selecting_target"}
            onClick={() => {
              onSelect();
            }}
          />
          <Enemy
            elementRef={elementRef}
            url={enemyPropsFromState.url || enemyImageUrl}
            transparentColor={enemyImageTransparentColor}
            x={enemyPropsFromState.x}
            y={enemyPropsFromState.y}
          />
          <Box
            name="weapon_box"
            absolute
            hidden={!weaponIsVisible}
            ratio="1/1"
            height="50%"
            x="center"
            y="center"
          >
            <SwordA elementRef={weaponElementRef} />
          </Box>
          <Box
            name="enemy_digits_box"
            absolute
            elementRef={enemyDigitsElementRef}
            hidden={enemyDamage === null}
            width="100%"
            height="100%"
          >
            <Box x="center" y="center">
              <Digits name="enemy_digits">{enemyDamage}</Digits>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  },
);
