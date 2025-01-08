import { forwardRef } from "preact/compat";
import { useImperativeHandle, useRef, useState } from "preact/hooks";
import { useDigitsDisplayAnimation } from "/animations/use_digits_display_animation.js";
import { useElementAnimation } from "/animations/use_element_animation.js";
import { usePartyMemberHitAnimation } from "/animations/use_party_member_hit_animation.js";
import { Box } from "/components/box/box.jsx";
import { Benjamin } from "/components/character/benjamin.jsx";
import { Digits } from "/components/text/digits.jsx";

export const Ally = forwardRef((props, ref) => {
  const elementRef = useRef();
  const [damage, damageSetter] = useState(null);

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

  const digitsElementRef = useRef();
  const [recoilAfterHit] = usePartyMemberHitAnimation({
    elementRef,
    duration: 500,
  });
  const [displayDamage] = useDigitsDisplayAnimation({
    elementRef: digitsElementRef,
    duration: 300,
    toY: -1.2,
  });

  useImperativeHandle(ref, () => {
    return {
      moveToAct,
      moveBackToPosition,
      recoilAfterHit,
      displayDamage: async (value) => {
        damageSetter(value);
        await displayDamage();
        damageSetter(null);
      },
    };
  });

  return (
    <Box name="ally_box" ratio="1/1" height="100%" x="center">
      <Benjamin ref={elementRef} direction="top" activity="walking" />
      <Box
        ref={digitsElementRef}
        name="digits_box"
        absolute
        hidden={damage === null}
        width="100%"
        height="100%"
      >
        <Box x="center" y="end">
          <Digits
            name="digits"
            dx="0.3em" // for some reason it's better centered with that
          >
            {damage}
          </Digits>
        </Box>
      </Box>
    </Box>
  );
});
