export const Zero = ({
  x,
  y,
  width,
  height,
  strokeWidth,
  outlineColor,
  outlineSize,
}) => {
  return (
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
          d="M228.8,666.2v-87.5h-87.5v-87.5H53.8V228.8h87.5v-87.5h87.5V53.8h262.5v87.5h87.5v87.5h87.5v262.5h-87.5v87.5h-87.5v87.5
		H228.8z M316.2,578.8h175v-350h-87.5v-87.5h-175v350h87.5V578.8z"
          stroke={outlineColor}
          stroke-width={outlineSize}
        />
      )}
      <path
        d="M228.8,666.2v-87.5h-87.5v-87.5H53.8V228.8h87.5v-87.5h87.5V53.8h262.5v87.5h87.5v87.5h87.5v262.5h-87.5v87.5h-87.5v87.5
		H228.8z M316.2,578.8h175v-350h-87.5v-87.5h-175v350h87.5V578.8z"
        stroke-width={strokeWidth}
      />
    </svg>
  );
};
