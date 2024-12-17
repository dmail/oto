import { useLayoutEffect, useRef, useState } from "preact/hooks";

export const MultiBorder = ({ borders }) => {
  const svgRef = useRef();
  let fullSize = borders.reduce((acc, border) => acc + border.size, 0);
  const deps = [];
  for (const border of borders) {
    deps.push(border.size, border.color, border.radius);
  }
  const [svgChildren, svgChildrenSetter] = useState([]);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    const svgParentNode = svg.parentNode;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      const availableWidth = svg.parentNode.offsetWidth;
      const availableHeight = svg.parentNode.offsetHeight;
      svg.setAttribute("width", availableWidth);
      svg.setAttribute("height", availableHeight);

      let xConsumed = 0;
      let yConsumed = 0;
      let rightConsumed = 0;
      let bottomConsumed = 0;
      let widthConsumed = 0;
      let heightConsumed = 0;
      let remainingWidth = availableWidth;
      let remainingHeight = availableHeight;
      let previousBorderSize;
      const corners = [];
      let previousRadius;
      for (const border of borders) {
        const borderSize = border.size;
        let borderRadiusRaw = border.radius;
        const borderRadius =
          borderRadiusRaw === undefined
            ? 0
            : borderRadiusRaw === "..."
              ? previousRadius - previousBorderSize
              : borderRadiusRaw;
        let borderWidthRaw = border.width;
        if (borderWidthRaw === undefined) borderWidthRaw = "50%";
        const borderWidth =
          typeof borderWidthRaw === "string"
            ? (parseInt(borderWidthRaw) / 100) * availableWidth
            : borderWidthRaw;
        let borderHeightRaw = border.height;
        if (borderHeightRaw === undefined) borderHeightRaw = "50%";
        const borderHeight =
          typeof borderHeightRaw === "string"
            ? (parseInt(borderHeightRaw) / 100) * availableHeight
            : borderHeightRaw;

        corners.push(
          <Corners
            rectangleWidth={remainingWidth}
            rectangleHeight={remainingHeight}
            x={xConsumed}
            y={yConsumed}
            width={borderWidth - rightConsumed}
            height={borderHeight - bottomConsumed}
            size={borderSize}
            radius={borderRadius}
            color={border.color}
            opacity={border.opacity}
          />,
        );
        xConsumed += borderSize;
        yConsumed += borderSize;
        rightConsumed += borderSize;
        bottomConsumed += borderSize;
        previousBorderSize = borderSize;
        previousRadius = borderRadius;
        widthConsumed += borderSize;
        heightConsumed += borderSize;
        remainingWidth = availableWidth - widthConsumed;
        remainingHeight = availableHeight - heightConsumed;
      }
      svgChildrenSetter(corners);
    });
    observer.observe(svgParentNode);
    return () => {
      observer.disconnect();
    };
  }, deps);

  return (
    <div
      style={{
        position: "absolute",
        inset: `-${fullSize}px`,
      }}
    >
      <svg ref={svgRef} style={{ overflow: "visible" }}>
        {svgChildren}
      </svg>
    </div>
  );
};

const Corners = ({
  rectangleWidth,
  rectangleHeight,
  x,
  y,
  width,
  height,
  size,
  radius,
  color,
  opacity,
}) => {
  return (
    <g name="corners" data-radius={radius}>
      <TopLeftCorner
        x={x}
        y={y}
        width={width}
        height={height}
        size={size}
        radius={radius}
        color={color}
        opacity={opacity}
      />
      <TopRightCorner
        x={rectangleWidth}
        y={y}
        width={width}
        height={height}
        size={size}
        radius={radius}
        color={color}
        opacity={opacity}
      />
      <BottomRightCorner
        x={rectangleWidth}
        y={rectangleHeight}
        width={width}
        height={height}
        size={size}
        radius={radius}
        color={color}
        opacity={opacity}
      />
      <BottomLeftCorner
        x={x}
        y={rectangleHeight}
        width={width}
        height={height}
        size={size}
        radius={radius}
        color={color}
        opacity={opacity}
      />
    </g>
  );
};

const TopLeftCorner = ({
  x,
  y,
  width,
  height,
  size,
  radius,
  color,
  opacity,
}) => {
  let d;
  if (radius > 0) {
    const outerRadius = radius;
    const innerRadius = outerRadius - size;
    d = [
      `M ${x},${y + height}`,
      `v -${height - outerRadius}`,
      `a ${outerRadius},${outerRadius} 0 0 1 ${outerRadius},-${outerRadius}`,
      `h ${width - outerRadius}`,
      `v ${size}`,
      ...(innerRadius > 0
        ? [
            `h -${width - size - innerRadius}`,
            `a ${innerRadius},${innerRadius} 0 0 0 -${innerRadius},${innerRadius}`,
            `v ${height - innerRadius - size}`,
            `h ${-size}`,
          ]
        : [`h -${width - size}`, `v ${height - size}`, `h -${size}`]),
    ];
  } else {
    d = [
      `M ${x},${y + size / 2}`,
      `h ${width}`,
      `M ${x + size / 2},${y + size}`,
      `v ${height - size}`,
    ];
  }
  return (
    <path
      name="top_left_corner"
      d={d.join(" ")}
      fill={color}
      opacity={opacity}
      stroke-width={1}
    />
  );
};
const TopRightCorner = ({
  x,
  y,
  width,
  height,
  size,
  radius,
  color,
  opacity,
}) => {
  let d;
  if (radius > 0) {
    const outerRadius = radius;
    const innerRadius = outerRadius - size;
    d = [
      `M ${x - width},${y}`,
      `h ${width - outerRadius}`,
      `a ${outerRadius},${outerRadius} 0 0 1 ${outerRadius},${outerRadius}`,
      `v ${height - outerRadius}`,
      `h -${size}`,
      ...(innerRadius > 0
        ? [
            `v -${height - size - innerRadius}`,
            `a ${innerRadius},${innerRadius} 0 0 0 -${innerRadius},-${innerRadius}`,
            `h -${width - innerRadius - size}`,
            `v -${size}`,
          ]
        : [`v -${height - size}`, `h ${-width + size}`, `v -${size}`]),
    ];
  } else {
    d = [
      `M ${x - width},${y}`,
      `h ${width}`,
      `v ${height}`,
      `h -${size}`,
      `v -${height - size}`,
      `h -${width - size}`,
      `v -${size}`,
    ];
  }

  return (
    <path
      name="top_right_corner"
      d={d.join(" ")}
      fill={color}
      opacity={opacity}
    />
  );
};
const BottomRightCorner = ({
  x,
  y,
  width,
  height,
  size,
  radius,
  color,
  opacity,
}) => {
  let d;
  if (radius > 0) {
    const outerRadius = radius;
    const innerRadius = outerRadius - size;
    d = [
      `M ${x},${y - height}`,
      `v ${height - outerRadius}`,
      `a ${outerRadius},${outerRadius} 0 0 1 -${outerRadius},${outerRadius}`,
      `h -${width - outerRadius}`,
      `v -${size}`,
      ...(innerRadius > 0
        ? [
            `h ${width - innerRadius - size}`,
            `a ${innerRadius},${innerRadius} 0 0 0 ${innerRadius},-${innerRadius}`,
            `v -${height - innerRadius - size}`,
            `h ${size}`,
          ]
        : [`h ${width - size}`, `v -${height - size}`, `h ${size}`]),
    ];
  } else {
    d = [
      `M ${x - size / 2},${y - height}`,
      `v ${height - size}`,
      `M ${x - width},${y - size / 2}`,
      `h ${width}`,
    ];
  }

  return (
    <path
      name="bottom_right_corner"
      d={d.join(" ")}
      fill={color}
      opacity={opacity}
    />
  );
};
const BottomLeftCorner = ({
  x,
  y,
  width,
  height,
  size,
  radius,
  color,
  opacity,
}) => {
  let d;

  if (radius > 0) {
    const outerRadius = radius;
    const innerRadius = outerRadius - size;
    d = [
      `M ${x + width},${y}`,
      `h -${width - outerRadius}`,
      `a ${outerRadius},${outerRadius} 0 0 1 -${outerRadius},-${outerRadius}`,
      `v -${height - outerRadius}`,
      `h ${size}`,
      ...(innerRadius > 0
        ? [
            `v ${height - innerRadius - size}`,
            `a ${innerRadius},${innerRadius} 0 0 0 ${innerRadius},${innerRadius}`,
            `h ${width - innerRadius - size}`,
            `v ${size}`,
          ]
        : [`v ${height - size}`, `h ${width - size}`, `v ${size}`]),
    ];
  } else {
    d = [
      `M ${x},${y - size / 2}`,
      `h ${width}`,
      `M ${x + size / 2},${y - size / 2}`,
      `v -${height - size / 2}`,
    ];
  }

  return (
    <path
      name="bottom_left_corner"
      d={d.join(" ")}
      fill={color}
      opacity={opacity}
    />
  );
};
