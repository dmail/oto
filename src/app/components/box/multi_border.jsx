import { useLayoutEffect, useState } from "preact/hooks";

export const useMultiBorder = (ref, borders) => {
  const [availableWidth, setAvailableWidth] = useState(0);
  const [availableHeight, setAvailableHeight] = useState(0);
  const [fontSizeComputed, fontSizeComputedSetter] = useState(16);

  useLayoutEffect(() => {
    const elementToObserve = ref.current;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      const availableWidth = elementToObserve.offsetWidth;
      const availableHeight = elementToObserve.offsetHeight;
      setAvailableWidth(availableWidth);
      setAvailableHeight(availableHeight);

      let { fontSize } = window.getComputedStyle(elementToObserve, null);
      fontSize = parseFloat(fontSize);
      fontSizeComputedSetter(fontSize);
    });
    observer.observe(elementToObserve);
    return () => {
      observer.disconnect();
    };
  }, []);

  const resolvedBorders = [];
  let borderFullSize = 0;
  let x = 0;
  let y = 0;
  let remainingWidth = availableWidth;
  let remainingHeight = availableHeight;
  for (const border of borders) {
    let {
      size,
      width = "50%",
      height = "50%",
      minWidth,
      minHeight,
      spacing = 0,
      radius = 0,
    } = border;
    let [cornerWidth, cornerHeight] = resolveDimensions({
      width,
      height,
      availableWidth: remainingWidth,
      availableHeight: remainingHeight,
      fontSize: fontSizeComputed,
    });
    minWidth = resolveSize(minWidth, {
      availableSize: remainingWidth,
      fontSize: fontSizeComputed,
    });
    if (minWidth && cornerWidth < minWidth) {
      cornerWidth = minWidth;
    }
    minHeight = resolveSize(minHeight, {
      availableSize: remainingHeight,
      fontSize: fontSizeComputed,
    });
    if (minHeight && cornerHeight < minHeight) {
      cornerHeight = minHeight;
    }
    const resolvedBorder = {
      ...border,
      x,
      y,
      width: cornerWidth,
      height: cornerHeight,
      rectangleWidth: remainingWidth,
      rectangleHeight: remainingHeight,
      size: resolveSize(size, {
        availableSize: remainingWidth,
        fontSize: fontSizeComputed,
      }),
      radius: resolveSize(radius, {
        availableSize: remainingWidth,
        fontSize: fontSizeComputed,
      }),
      spacing: resolveSize(spacing, {
        availableSize: remainingWidth,
        fontSize: fontSizeComputed,
      }),
    };
    const sizeTakenByBorder = resolvedBorder.size + resolvedBorder.spacing;
    borderFullSize += sizeTakenByBorder;
    x += sizeTakenByBorder;
    y += sizeTakenByBorder;
    remainingWidth -= sizeTakenByBorder * 2;
    remainingHeight -= sizeTakenByBorder * 2;
    resolvedBorders.push(resolvedBorder);
  }

  return [resolvedBorders, availableWidth, availableHeight, borderFullSize];
};

export const MultiBorder = ({
  width,
  height,
  borders,
  borderFullSize,
  children,
}) => {
  const corners = [];
  for (const border of borders) {
    const cornerProps = {
      ...border,
    };
    corners.push(<Corners {...cornerProps}></Corners>);
  }
  // const svgRef= useRef();

  return (
    <>
      <div
        name="multi_border"
        style={{
          position: "absolute",
          inset: `-${borderFullSize}px`,
        }}
      >
        <svg
          // ref={svgRef}
          style={{ overflow: "visible" }}
          width={width}
          height={height}
        >
          {corners}
        </svg>
      </div>
      {children}
    </>
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
  strokeColor,
  strokeSize,
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
        strokeColor={strokeColor}
        strokeSize={strokeSize}
        opacity={opacity}
      />
      <TopRightCorner
        x={x + rectangleWidth}
        y={y}
        width={width}
        height={height}
        size={size}
        radius={radius}
        color={color}
        strokeColor={strokeColor}
        strokeSize={strokeSize}
        opacity={opacity}
      />
      <BottomRightCorner
        x={x + rectangleWidth}
        y={y + rectangleHeight}
        width={width}
        height={height}
        size={size}
        radius={radius}
        color={color}
        strokeColor={strokeColor}
        strokeSize={strokeSize}
        opacity={opacity}
      />
      <BottomLeftCorner
        x={x}
        y={y + rectangleHeight}
        width={width}
        height={height}
        size={size}
        radius={radius}
        color={color}
        strokeColor={strokeColor}
        strokeSize={strokeSize}
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
  strokeColor,
  strokeSize,
  opacity,
}) => {
  if (size <= 0 || width <= 0) {
    return null;
  }
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
      stroke={strokeColor}
      stroke-width={strokeSize}
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
  strokeColor,
  strokeSize,
  opacity,
}) => {
  if (size <= 0 || width <= 0) {
    return null;
  }
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
      stroke={strokeColor}
      stroke-width={strokeSize}
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
  strokeColor,
  strokeSize,
  opacity,
}) => {
  if (size <= 0 || width <= 0) {
    return null;
  }
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
      stroke={strokeColor}
      stroke-width={strokeSize}
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
  strokeColor,
  strokeSize,
  opacity,
}) => {
  if (size <= 0 || width <= 0) {
    return null;
  }
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
      stroke={strokeColor}
      stroke-width={strokeSize}
    />
  );
};

const resolveSize = (size, { availableSize, fontSize }) => {
  if (typeof size === "string") {
    if (size.endsWith("%")) {
      return availableSize * (parseFloat(size) / 100);
    }
    if (size.endsWith("px")) {
      return parseFloat(size);
    }
    if (size.endsWith("em")) {
      return parseFloat(size) * fontSize;
    }
    return parseFloat(size);
  }
  return size;
};
const resolveDimensions = ({
  width,
  height,
  availableWidth,
  availableHeight,
  fontSize,
}) => {
  const widthNumber = resolveSize(width, {
    availableSize: availableWidth,
    fontSize,
  });
  const heightNumber = resolveSize(height, {
    availableSize: availableHeight,
    fontSize,
  });
  return [widthNumber, heightNumber];
};
