import { useLayoutEffect, useRef, useState } from "preact/hooks";

export const MultiBorder = ({ borders, children }) => {
  for (const border of borders) {
    children = <CornersWrapper {...border}>{children}</CornersWrapper>;
  }
  return <>{children}</>;
};

const CornersWrapper = ({
  width,
  height,
  size,
  color,
  radius,
  opacity,
  children,
}) => {
  const divRef = useRef();
  const svgRef = useRef();
  const [availableWidth, setAvailableWidth] = useState(0);
  const [availableHeight, setAvailableHeight] = useState(0);
  const [borderWidth, borderWidthSetter] = useState(0);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    const svgParentNode = svg.parentNode;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      const availableWidth = svgParentNode.offsetWidth;
      const availableHeight = svgParentNode.offsetHeight;
      setAvailableWidth(availableWidth);
      setAvailableHeight(availableHeight);
      const div = divRef.current;
      const { borderWidth } = window.getComputedStyle(div, null);
      borderWidthSetter(parseFloat(borderWidth));
    });
    observer.observe(svgParentNode);
    return () => {
      observer.disconnect();
    };
  }, [size, color, radius]);

  // si c'est en em comment on fait?
  const borderWidthComputed = isFinite(size) ? `${parseInt(size)}px` : size;
  const cornerWidth =
    typeof width === "string" && width.endsWith("%")
      ? availableWidth * (parseInt(width) / 100)
      : width;
  const cornerHeight =
    typeof height === "string" && height.endsWith("%")
      ? availableHeight * (parseInt(height) / 100)
      : height;
  const cornerRadius = radius;

  return (
    <div
      ref={divRef}
      style={{
        borderWidth: borderWidthComputed,
        borderStyle: "solid",
        borderColor: "transparent",
        position: "relative",
        display: "inline-flex",
        width: "100%",
        height: "100%",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: `-${borderWidthComputed}`,
        }}
      >
        <svg
          ref={svgRef}
          style={{ overflow: "visible" }}
          width={availableWidth}
          height={availableHeight}
        >
          <Corners
            rectangleWidth={availableWidth}
            rectangleHeight={availableHeight}
            x={0}
            y={0}
            width={cornerWidth}
            height={cornerHeight}
            size={borderWidth}
            radius={cornerRadius}
            color={color}
            opacity={opacity}
          />
        </svg>
      </div>
      {children}
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
  if (size > width) {
    size = width;
  }
  if (size > height) {
    size = height;
  }
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
      `M ${x},${y}`,
      `h ${width}`,
      `v ${size}`,
      `h -${width - size}`,
      `v ${height - size}`,
      `h -${size}`,
      `v -${height}`,
    ];
  }
  return (
    <path
      name="top_left_corner"
      d={d.join(" ")}
      fill={color}
      opacity={opacity}
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
  if (size > width) {
    size = width;
  }
  if (size > height) {
    size = height;
  }

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
  if (size > width) {
    size = width;
  }
  if (size > height) {
    size = height;
  }

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
      `M ${x},${y - height}`,
      `v ${height}`,
      `h -${width}`,
      `v -${size}`,
      `h ${width - size}`,
      `v -${height - size}`,
      `h ${size}`,
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
  if (size > width) {
    size = width;
  }
  if (size > height) {
    size = height;
  }

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
      `M ${x + width},${y}`,
      `h ${-width}`,
      `v -${height}`,
      `h ${size}`,
      `v ${height - size}`,
      `h ${width - size}`,
      `v ${size}`,
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
