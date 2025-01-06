import { forwardRef } from "preact/compat";
import { useImperativeHandle, useRef, useState } from "preact/hooks";
import { OpponentSprite } from "./opponent_sprite/opponent_sprite.jsx";
import { SwordA } from "./sword_a.jsx";
import { useCanvasEraseAnimation } from "/animations/use_canvas_erase_animation.js";
import { useCanvasGlowAnimation } from "/animations/use_canvas_glow_animation.js";
import { useDigitsDisplayAnimation } from "/animations/use_digits_display_animation.js";
import { useElementAnimation } from "/animations/use_element_animation.js";
import { Box } from "/components/box/box.jsx";
import { Message } from "/components/message/message.jsx";
import { Digits } from "/components/text/digits.jsx";

export const Opponent = forwardRef(
  (
    {
      isDead,
      fightIsWaiting,
      playerIsSelectingTarget,
      name,
      imageUrl,
      imageX,
      imageY,
      imageWidth,
      imageHeight,
      imageTransparentColor,
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
    const [erase] = useCanvasEraseAnimation({
      id: "enemy_erase",
      elementRef,
      iterations: 4,
      duration: 300,
    });

    const digitsElementRef = useRef();
    const [displayDamage] = useDigitsDisplayAnimation({
      elementRef: digitsElementRef,
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

    const [enemyDamage, enemyDamageSetter] = useState(null);

    useImperativeHandle(ref, () => {
      return {
        glow,
        erase,
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
        name="opponent_container_box"
        width="100%"
        height="100%"
        x="center"
      >
        <Box name="top_ui" width="100%" innerSpacing="0.5em">
          <Message
            name="opponent_name"
            hidden={!fightIsWaiting || isDead}
            innerSpacing="0.7em"
          >
            {name}
          </Message>
        </Box>
        <Box
          name="opponent_box"
          ratio="1/1"
          height="..."
          x="center"
          innerSpacing="10"
          focused={playerIsSelectingTarget}
          focusedOutlineWidth="20%"
          focusedOutlineRadius={10}
          focusedOutlineSize={7}
          onClick={
            playerIsSelectingTarget
              ? () => {
                  onSelect();
                }
              : undefined
          }
        >
          <OpponentSprite
            elementRef={elementRef}
            url={imageUrl}
            transparentColor={imageTransparentColor}
            x={imageX}
            y={imageY}
            width={imageWidth}
            height={imageHeight}
            hidden={isDead}
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
            ref={digitsElementRef}
            name="opponent_digits_box"
            absolute
            hidden={enemyDamage === null}
            width="100%"
            height="100%"
          >
            <Box x="center" y="center">
              <Digits name="opponent_digits">{enemyDamage}</Digits>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  },
);
