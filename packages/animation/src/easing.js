// https://easings.net/

export const EASING = {
  LINEAR: (x) => x,
  EASE: (x) => {
    return bezier(x, 0.25, 0.1, 0.25, 1.0);
  },
  EASE_OUT_EXPO: (x) => {
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
  },
  EASE_OUT_ELASTIC: (x) => {
    const c4 = (2 * Math.PI) / 3;
    if (x === 0) {
      return 0;
    }
    if (x === 1) {
      return 1;
    }
    return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
  },
};

// https://github.com/pouyamer/cubic-bezier-in-js/tree/master
// BEWARE DOES NOT WORK
export const cubicBezier = (t, x0, y0, x1, y1) => {
  if (!(x0 >= 0 && x0 <= 1 && x1 >= 0 && x1 <= 1)) {
    throw new Error(
      `CubicBezier x1 & x2 values must be { 0 < x < 1 }, got { x1 : ${x0}, x2: ${x1} }`,
    );
  }
  const ax = 1.0 - (x1 = 3.0 * (x1 - x0) - (x0 *= 3.0)) - x0;
  const ay = 1.0 - (y1 = 3.0 * (y1 - y0) - (y0 *= 3.0)) - y0;
  let i = 0;
  let r = 0.0;
  let s = 0.0;
  let d = 0.0;
  let x = 0.0;

  for (r = t, i = 0; i < 32; i++) {
    x = r * (r * (r * ax + x1) + x0);
    if (Math.abs(x - t) < 1e-5) {
      return r * (r * (r * ay + y1) + y0);
    }
    d = r * (r * ax * 3.0 + x1 * 2.0) + x0;
    if (Math.abs(d) < 1e-5) {
      break;
    }
    r -= x / d;
  }
  s = 0.0;
  r = t;
  if (s > r) {
    return 0;
  }
  d = 1.0;
  if (d < r) {
    return 1;
  }
  while (d > s) {
    x = r * (r * (r * ax + x1) + x0);
    if (Math.abs(x - t) < 1e-5) {
      break;
    }
    if (t > x) {
      s = r;
    } else {
      d = r;
      r = 0.5 * (d - s) + s;
    }
  }
  return r * (r * (r * ay + y1) + y0);
};

export const bezier = (t, initial, p1, p2, final) => {
  return (
    (1 - t) * (1 - t) * (1 - t) * initial +
    3 * (1 - t) * (1 - t) * t * p1 +
    3 * (1 - t) * t * t * p2 +
    t * t * t * final
  );
};
