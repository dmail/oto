import { computed, signal } from "@preact/signals";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "preact/hooks";
import appStyleSheet from "./app.css" with { type: "css" };
import { MountainAndSkyBattleBackground } from "./battle_background/battle_backgrounds.jsx";
import { DialogTextBox } from "./components/dialog_text_box/dialog_text_box.jsx";
import { Lifebar } from "./components/lifebar/lifebar.jsx";
import { taurus } from "./enemy/taurus.js";
import { Ally } from "./fight/ally.jsx";
import { MenuFight } from "./fight/menu_fight.jsx";
import { Opponent } from "./fight/oponent.jsx";
import { SwordAIcon } from "./fight/sword_a.jsx";
import { swordASoundUrl } from "./fight/sword_sound_url.js";
import { WhiteCurtain } from "./fight/white_curtain.jsx";
import { useBooleanState } from "./hooks/use_boolean_state.js";
import { useKeyEffect } from "./hooks/use_key_effect.js";
import { useSound } from "./hooks/use_sound.js";
import { PauseDialog } from "./interface/pause_dialog.jsx";
import { Box } from "./layout/box.jsx";
import { pause, pausedSignal, play } from "./signals.js";

// const enemiesSignal = signal([taurus]);
const enemySignal = signal(taurus);
const enemyImageUrlSignal = computed(() => enemySignal.value.url);
const enemyImageTransparentColorSignal = computed(
  () => enemySignal.value.transparentColor,
);
const enemyNameSignal = computed(() => enemySignal.value.name);
const enemyHpMaxSignal = computed(() => enemySignal.value.attributes.hp);
const enemyAttackSignal = computed(() => enemySignal.value.attributes.attack);
const enemyDefenseSignal = computed(() => enemySignal.value.attributes.defense);
const enemySpeedSignal = computed(() => enemySignal.value.attributes.speed);
const enmyStatesSignal = computed(() => enemySignal.value.states);

const heroSpeedSignal = signal(1);
const heroAttackSignal = signal(1);
const heroDefenseSignal = signal(1);
const weaponAttackSignal = signal(20);

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
  const enemyAttack = enemyAttackSignal.value;
  const enemyDefense = enemyDefenseSignal.value;
  const enemySpeed = enemySpeedSignal.value;
  const enemyHpMax = enemyHpMaxSignal.value;
  const enemyStates = enmyStatesSignal.value;
  const oponentRef = useRef();
  const [enemyHp, enemyHpSetter] = useState(enemyHpMax);
  const decreaseEnemyHp = useCallback((value) => {
    enemyHpSetter((hp) => hp - value);
  }, []);
  const heroRef = useRef();
  const heroAttack = heroAttackSignal.value;
  const heroDefense = heroDefenseSignal.value;
  const heroSpeed = heroSpeedSignal.value;
  const weaponAttack = weaponAttackSignal.value;

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

  const dialogRef = useRef();

  const performEnemyTurn = async () => {
    let damage = enemyAttack - heroDefense;
    if (damage < 0) {
      damage = 0;
    }
    await dialogRef.current.alert("Taurus attaque avec Cornes");
    await oponentRef.current.glow();
    await heroRef.current.recoilAfterHit();
    await new Promise((resolve) => setTimeout(resolve, 150));
    await heroRef.current.displayDamage(damage);
    decreaseHeroHp(15);
  };
  const performHeroTurn = async () => {
    await dialogRef.current.alert("Hero attaque avec Epée -A-");
    let damage = heroAttack + weaponAttack - enemyDefense;
    if (damage < 0) {
      damage = 0;
    }
    await heroRef.current.moveToAct();
    showWhiteCurtain();
    swordSound.currentTime = 0.15;
    swordSound.play();
    await oponentRef.current.playWeaponAnimation();
    const moveBackToPositionPromise = heroRef.current.moveBackToPosition();
    await new Promise((resolve) => setTimeout(resolve, 200));
    await Promise.all([
      oponentRef.current.displayDamage(damage),
      moveBackToPositionPromise,
    ]);
    decreaseEnemyHp(damage);
  };
  const startTurn = async () => {
    turnStateSetter("running");
    if (enemySpeed > heroSpeed) {
      await performEnemyTurn();
      await performHeroTurn();
      turnStateSetter("");
      return;
    }
    await performHeroTurn();
    await performEnemyTurn();
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
              enemyName={enemyNameSignal.value}
              enemyHp={enemyHp}
              enemyHpMax={enemyHpMax}
              enemyStates={enemyStates}
              enemyImageUrl={enemyImageUrlSignal.value}
              enemyImageTransparentColor={
                enemyImageTransparentColorSignal.value
              }
              onSelect={() => {
                startTurn();
              }}
            />
          </Box>
          <Box name="front_line" width="100%" height="10%"></Box>
          <Box name="allies_box" height="10%" width="100%">
            <Ally ref={heroRef} />
          </Box>
          <Box name="bottom_ui" width="100%" height="...">
            <Box
              absolute
              width="100%"
              height="95%"
              contentX="center"
              contentY="end"
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
            <DialogTextBox
              absolute
              width="90%"
              height="80%"
              contentX="center"
              contentY="end"
              x="center"
              y="center"
              style={{
                pointerEvents: "none",
              }}
              ref={dialogRef}
            ></DialogTextBox>
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
