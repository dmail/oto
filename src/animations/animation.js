import { animateElement } from "./element/animate_element.js";
import { animateParallel } from "./list/animate_parallel.js";
import { animateSequence } from "./list/animate_sequence.js";
import { animateNumber } from "./number/animate_number.js";
import { EASING } from "./utils/easing.js";

export { animateDamageDisplay } from "./damage/damage.js";
export { erase } from "./erase/erase.js";
export { glow } from "./glow/glow.js";
export { useFrame } from "./hooks/use_frame.js";
export { animateRecoilAfterHit } from "./recoil_after_hit.js";

export const ANIMATION = {
  animateElement,
  animateNumber,
  sequence: animateSequence,
  parallel: animateParallel,
  EASING,
};
