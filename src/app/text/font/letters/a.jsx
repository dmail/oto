export const A = ({ strokeWidth, outlineColor, outlineSize }) => (
  <svg viewBox="0 0 720 720" style="overflow:visible">
    {outlineColor && (
      <path
        d="M53.8,666.2V228.8h87.5v-87.5h87.5V53.8h262.5v87.5h87.5v87.5h87.5v437.5h-175v-175H228.8v175H53.8z M228.8,403.8h262.5
		v-175h-87.5v-87.5h-87.5v87.5h-87.5V403.8z"
        stroke={outlineColor}
        stroke-width={outlineSize}
      />
    )}
    <path
      d="M53.8,666.2V228.8h87.5v-87.5h87.5V53.8h262.5v87.5h87.5v87.5h87.5v437.5h-175v-175H228.8v175H53.8z M228.8,403.8h262.5
		v-175h-87.5v-87.5h-87.5v87.5h-87.5V403.8z"
      stroke-width={strokeWidth}
    />
  </svg>
);
