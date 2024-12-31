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
import { MenuFight } from "../fight/menu_fight.jsx";
import { Opponent } from "../fight/oponent.jsx";
import { SwordAIcon } from "../fight/sword_a.jsx";
import { swordASoundUrl } from "../fight/sword_sound_url.js";
import { taurus } from "../fight/taurus.js";
import { WhiteCurtain } from "../fight/white_curtain.jsx";
import { pause, pausedSignal, play } from "../signals.js";
import gameStyleSheet from "./game.css" with { type: "css" };
import { PauseDialog } from "./pause_dialog.jsx";

const opponentSignal = signal(taurus);
const opponentImageSignal = computed(() => opponentSignal.value.image);
const opponentNameSignal = computed(() => opponentSignal.value.name);
const opponentHpMaxSignal = computed(() => opponentSignal.value.attributes.hp);
const opponentAttackSignal = computed(
  () => opponentSignal.value.attributes.attack,
);
const opponentDefenseSignal = computed(
  () => opponentSignal.value.attributes.defense,
);
const opponentSpeedSignal = computed(
  () => opponentSignal.value.attributes.speed,
);
const opponentStatesSignal = computed(() => opponentSignal.value.states);
const opponentAbilitiesSignal = computed(() => opponentSignal.value.abilities);

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
  const opponentName = opponentNameSignal.value;
  const opponentAttack = opponentAttackSignal.value;
  const opponentDefense = opponentDefenseSignal.value;
  const opponentSpeed = opponentSpeedSignal.value;
  const opponentHpMax = opponentHpMaxSignal.value;
  const [opponentHp, opponentHpSetter] = useState(opponentHpMax);
  const decreaseOpponentHp = useCallback((value) => {
    opponentHpSetter((hp) => hp - value);
  }, []);
  useEffect(() => {
    if (opponentHp <= 0) {
      oponentRef.current.erase();
    }
  }, [opponentHp]);
  const opponentAbilitiesBase = opponentAbilitiesSignal.value;
  const opponentStates = opponentStatesSignal.value;
  const opponentStateKey = opponentStates
    ? Object.keys(opponentStates).find((key) => {
        const { conditions } = opponentStates[key];
        if (
          conditions.hp &&
          conditions.hp({ hp: opponentHp, hpMax: opponentHpMax })
        ) {
          return true;
        }
        return false;
      })
    : null;
  const opponentPropsFromState = opponentStateKey
    ? opponentStates[opponentStateKey]
    : {};
  const opponentAbilities = Object.assign(
    opponentAbilitiesBase,
    opponentPropsFromState.abilities,
  );
  let opponentImage = opponentImageSignal.value;
  if (opponentPropsFromState.image) {
    opponentImage = {
      ...opponentImage,
      ...opponentPropsFromState.image,
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

  const performOpponentTurn = async () => {
    let abilityChoosen = null;
    for (const abilityKey of Object.keys(opponentAbilities)) {
      const ability = opponentAbilities[abilityKey];
      if (!ability) {
        continue;
      }
      abilityChoosen = ability;
      break;
    }
    let damage = opponentAttack + abilityChoosen.power - heroDefense;
    if (damage < 0) {
      damage = 0;
    }
    const oponentAlert = dialogRef.current.alert(
      `${opponentName} attaque avec ${abilityChoosen.name}.`,
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
    let damage = heroAttack + weaponPower - opponentDefense;
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
    decreaseOpponentHp(damage);
  };
  const startTurn = async () => {
    turnStateSetter("running");
    if (opponentSpeed > heroSpeed) {
      await performOpponentTurn();
      await performHeroTurn();
      turnStateSetter("");
      return;
    }
    await performHeroTurn();
    await performOpponentTurn();
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
          <Box name="opponents_box" width="100%" height="55%">
            <Opponent
              ref={oponentRef}
              turnState={turnState}
              name={opponentName}
              imageUrl={opponentImage.url}
              imageTransparentColor={opponentImage.transparentColor}
              imageX={opponentImage.x}
              imageY={opponentImage.y}
              imageWidth={opponentImage.width}
              imageHeight={opponentImage.height}
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
