import { forwardRef } from "preact/compat";
import { useImperativeHandle, useRef, useState } from "preact/hooks";
import { SwordAImg } from "./sword_a.jsx";
import {
  animateDamageDisplay,
  ANIMATION,
  erase,
  glow,
} from "/animations/animation.js";
import { Box } from "/components/box/box.jsx";
import { Img } from "/components/img/img.jsx";
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
    const imgRef = useRef();
    const digitsElementRef = useRef();
    const weaponElementRef = useRef();
    const [enemyDamage, enemyDamageSetter] = useState(null);

    useImperativeHandle(ref, () => {
      return {
        glow: async () => {
          await glow(imgRef.current, {
            id: "enemy_glow",
            elementRef: imgRef,
            from: "black",
            to: "white",
            duration: 300,
          }).finished;
        },
        erase: async () => {
          await erase(imgRef.current, {
            id: "enemy_erase",
            iterations: 4,
            duration: 300,
          }).finished;
        },
        playWeaponAnimation: async () => {
          await ANIMATION.animateElement(weaponElementRef.current, {
            id: "weapon_animation",
            from: {
              x: 25,
              display: "",
            },
            to: {
              x: -15,
              display: "none",
            },
            duration: 200,
          }).finished;
        },
        displayDamage: async (value) => {
          enemyDamageSetter(value);
          await animateDamageDisplay(digitsElementRef.current, {
            duration: 300,
          }).finished;
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
          <Img
            ref={imgRef}
            source={{
              url: imageUrl,
              x: imageX,
              y: imageY,
              transparentColor: imageTransparentColor,
            }}
            width={imageWidth}
            height={imageHeight}
            hidden={isDead}
          />
          <Box
            name="weapon_box"
            absolute
            ratio="1/1"
            height="50%"
            x="center"
            y="center"
          >
            <SwordAImg
              style={{
                display: "none",
              }}
              ref={weaponElementRef}
            />
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
