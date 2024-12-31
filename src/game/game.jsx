import { computed, signal } from "@preact/signals";
import { useBooleanState } from "hooks/use_boolean_state.js";
import { useKeyEffect } from "hooks/use_key_effect.js";
import { useSound } from "hooks/use_sound.js";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "preact/hooks";
import { Box, borderWithStroke } from "../components/box/box.jsx";
import { DialogTextBox } from "../components/dialog_text_box/dialog_text_box.jsx";
import { Lifebar } from "../components/lifebar/lifebar.jsx";
import { Ally } from "../fight/ally.jsx";
import { MountainAndSkyBattleBackground } from "../fight/battle_background/battle_backgrounds.jsx";
import { taurus } from "../fight/enemy/taurus.js";
import { MenuFight } from "../fight/menu_fight.jsx";
import { Opponent } from "../fight/oponent.jsx";
import { SwordAIcon } from "../fight/sword_a.jsx";
import { swordASoundUrl } from "../fight/sword_sound_url.js";
import { WhiteCurtain } from "../fight/white_curtain.jsx";
import { pause, pausedSignal, play } from "../signals.js";
import gameStyleSheet from "./game.css" with { type: "css" };
import { PauseDialog } from "./pause_dialog.jsx";

// const enemiesSignal = signal([taurus]);
const enemySignal = signal(taurus);
const enemyImageSignal = computed(() => enemySignal.value.image);
const enemyNameSignal = computed(() => enemySignal.value.name);
const enemyHpMaxSignal = computed(() => enemySignal.value.attributes.hp);
const enemyAttackSignal = computed(() => enemySignal.value.attributes.attack);
const enemyDefenseSignal = computed(() => enemySignal.value.attributes.defense);
const enemySpeedSignal = computed(() => enemySignal.value.attributes.speed);
const enmyStatesSignal = computed(() => enemySignal.value.states);
const enemyAbilitiesSignal = computed(() => enemySignal.value.abilities);

const heroSpeedSignal = signal(1);
const heroAttackSignal = signal(1);
const heroDefenseSignal = signal(1);
const weaponPowerSignal = signal(20);

export const Game = () => {
  useLayoutEffect(() => {
    document.adoptedStyleSheets = [
      ...document.adoptedStyleSheets,
      gameStyleSheet,
    ];
    return () => {
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
        (s) => s !== gameStyleSheet,
      );
    };
  }, []);
  const enemyName = enemyNameSignal.value;
  const enemyAttack = enemyAttackSignal.value;
  const enemyDefense = enemyDefenseSignal.value;
  const enemySpeed = enemySpeedSignal.value;
  const enemyHpMax = enemyHpMaxSignal.value;
  const [enemyHp, enemyHpSetter] = useState(enemyHpMax);
  const decreaseEnemyHp = useCallback((value) => {
    enemyHpSetter((hp) => hp - value);
  }, []);
  useEffect(() => {
    if (enemyHp <= 0) {
      oponentRef.current.erase();
    }
  }, [enemyHp]);
  const enemyAbilitiesBase = enemyAbilitiesSignal.value;
  const enemyStates = enmyStatesSignal.value;
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
  const enemyAbilities = Object.assign(
    enemyAbilitiesBase,
    enemyPropsFromState.abilities,
  );
  let enemyImage = enemyImageSignal.value;
  if (enemyPropsFromState.image) {
    enemyImage = {
      ...enemyImage,
      ...enemyPropsFromState.image,
    };
  }
  const oponentRef = useRef();

  const heroRef = useRef();
  const heroAttack = heroAttackSignal.value;
  const heroDefense = heroDefenseSignal.value;
  const heroSpeed = heroSpeedSignal.value;
  const weaponPower = weaponPowerSignal.value;

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
    let abilityChoosen = null;
    for (const abilityKey of Object.keys(enemyAbilities)) {
      const ability = enemyAbilities[abilityKey];
      if (!ability) {
        continue;
      }
      abilityChoosen = ability;
      break;
    }
    let damage = enemyAttack + abilityChoosen.power - heroDefense;
    if (damage < 0) {
      damage = 0;
    }
    const oponentAlert = dialogRef.current.alert(
      `${enemyName} attaque avec ${abilityChoosen.name}.`,
      {
        timeout: 500,
      },
    );
    await oponentRef.current.glow();
    await oponentAlert.close();
    await heroRef.current.recoilAfterHit();
    await new Promise((resolve) => setTimeout(resolve, 150));
    await heroRef.current.displayDamage(damage);
    decreaseHeroHp(damage);
  };
  const performHeroTurn = async () => {
    const heroAlert = dialogRef.current.alert("Hero attaque avec Epée -A-.", {
      timeout: 500,
    });
    let damage = heroAttack + weaponPower - enemyDefense;
    if (damage < 0) {
      damage = 0;
    }
    await heroRef.current.moveToAct();
    showWhiteCurtain();
    swordSound.currentTime = 0.15;
    swordSound.play();
    await oponentRef.current.playWeaponAnimation();
    await heroAlert.close();
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
              name={enemyName}
              imageUrl={enemyImage.url}
              imageTransparentColor={enemyImage.transparentColor}
              imageX={enemyImage.x}
              imageY={enemyImage.y}
              imageWidth={enemyImage.width}
              imageHeight={enemyImage.height}
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
              ref={dialogRef}
              absolute
              width="90%"
              height="80%"
              contentX="start"
              contentY="start"
              x="center"
              y="center"
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
            border={borderWithStroke({
              color: "white",
              size: 2,
              strokeColor: "black",
            })}
          >
            <Box name="lifebar_box" width="80%" height="30" y="center">
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
            border={borderWithStroke({
              color: "white",
              size: 2,
              strokeColor: "black",
            })}
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
