export const Spacing = ({
  around,
  left,
  top,
  x,
  y,
  right,
  bottom,
  children,
}) => {
  if (!around && !y && !x && !top && !left && !right && !bottom) {
    return <>{children}</>;
  }

  const style = {
    display: "inline-flex",
    width: "100%",
    height: "100%",
    position: "relative",
  };
  if (around !== undefined) {
    style.padding = isFinite(around)
      ? parseInt(around)
      : SPACING_SIZES[around] || around;
  }
  if (y) {
    style.paddingTop = style.paddingBottom = isFinite(y)
      ? parseInt(y)
      : SPACING_SIZES[y] || y;
  }
  if (x) {
    style.paddingLeft = style.paddingRight = isFinite(x)
      ? parseInt(x)
      : SPACING_SIZES[x] || x;
  }
  if (top) {
    style.paddingTop = isFinite(top)
      ? parseInt(top)
      : SPACING_SIZES[top] || top;
  }
  if (left) {
    style.paddingLeft = isFinite(left)
      ? parseInt(left)
      : SPACING_SIZES[left] || left;
  }
  if (right) {
    style.paddingRight = isFinite(right)
      ? parseInt(right)
      : SPACING_SIZES[right] || right;
  }
  if (bottom) {
    style.paddingBottom = isFinite(bottom)
      ? parseInt(bottom)
      : SPACING_SIZES[bottom] || bottom;
  }

  return <div style={style}> {children}</div>;
};

const SPACING_SIZES = {
  xxl: 100,
  xl: 50,
  l: 20,
  md: 10,
  s: 5,
  xs: 2,
  xxs: 1,
};
