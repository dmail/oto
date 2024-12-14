import { forwardRef } from "preact/compat";
import { useImperativeHandle, useRef, useState } from "preact/hooks";
import { useDigitsDisplayAnimation } from "/app/animations/use_digits_display_animation.js";
import { useElementAnimation } from "/app/animations/use_element_animation.js";
import { usePartyMemberHitAnimation } from "/app/animations/use_party_member_hit_animation.js";
import { Benjamin } from "/app/character/benjamin.jsx";
import { Box } from "/app/components/box/box.jsx";
import { Digits } from "/app/components/text/digits.jsx";

export const Ally = forwardRef((props, ref) => {
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
        ref={heroDigitsElementRef}
        name="hero_digits_box"
        absolute
        hidden={heroDamage === null}
        width="100%"
        height="100%"
      >
        <Box x="center" y="end">
          <Digits
            name="hero_digits"
            dx="0.3em" // for some reason it's better centered with that
          >
            {heroDamage}
          </Digits>
        </Box>
      </Box>
    </Box>
  );
});
