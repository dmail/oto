import { forwardRef } from "preact/compat";
import { useImperativeHandle, useRef, useState } from "preact/hooks";
import { useCanvasGlowAnimation } from "/app/animations/use_canvas_glow_animation.js";
import { useDigitsDisplayAnimation } from "/app/animations/use_digits_display_animation.js";
import { useElementAnimation } from "/app/animations/use_element_animation.js";
import { Message } from "/app/components/message/message.jsx";
import { Enemy } from "/app/enemy/enemy.jsx";
import { Selector } from "/app/fight/selector.jsx";
import { SwordA } from "/app/fight/sword_a.jsx";
import { Box } from "/app/layout/box.jsx";
import { Digits } from "/app/text/digits.jsx";

export const Opponent = forwardRef(
  (
    {
      // name,
      turnState,
      enemyName,
      enemyHp,
      enemyHpMax,
      enemyStates,
      enemyImageUrl,
      enemyImageTransparentColor,
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
          <Message invisible={turnState !== ""} innerSpacing="0.7em">
            {enemyName}
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
            ref={enemyDigitsElementRef}
            name="enemy_digits_box"
            absolute
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
