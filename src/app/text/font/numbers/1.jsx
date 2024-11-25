export const One = ({
  x,
  y,
  width,
  height,
  strokeWidth,
  outlineColor,
  outlineSize,
}) => (
  <svg
    x={x}
    y={y}
    width={width}
    height={height}
    viewBox="0 0 720 720"
    style="overflow:visible"
  >
    {outlineColor && (
      <path
        d="M97.5,666.2v-87.5h175v-350H185v-87.5h87.5V53.8h175v525h175v87.5H97.5z"
        stroke={outlineColor}
        stroke-width={outlineSize}
      />
    )}
    <path
      d="M97.5,666.2v-87.5h175v-350H185v-87.5h87.5V53.8h175v525h175v87.5H97.5z"
      stroke-width={strokeWidth}
    />
  </svg>
);
