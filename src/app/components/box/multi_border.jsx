import { useLayoutEffect, useState } from "preact/hooks";

export const useMultiBorder = (ref, borders) => {
  const [availableWidth, setAvailableWidth] = useState(0);
  const [availableHeight, setAvailableHeight] = useState(0);
  const [fontSize, fontSizeSetter] = useState(16);
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
      fontSizeSetter(fontSize);
    });
    observer.observe(elementToObserve);
    return () => {
      observer.disconnect();
    };
  }, []);

  let solidBorderFullSize = 0;
  let outsideBorderFullSize = 0;
  let borderFullSize = 0;
  const resolvedBorders = [];
  for (const border of borders) {
    let { size, spacing = 0, radius = 0 } = border;
    const resolvedBorder = {
      ...border,
      size: resolveSize(size, {
        availableSize: availableWidth,
        fontSize,
      }),
      radius: resolveSize(radius, {
        availableSize: availableWidth,
        fontSize,
      }),
      spacing: resolveSize(spacing, {
        availableSize: availableWidth,
        fontSize,
      }),
    };
    const sizeTakenByBorder = resolvedBorder.size + resolvedBorder.spacing;
    borderFullSize += sizeTakenByBorder;
    if (border.outside) {
      outsideBorderFullSize += sizeTakenByBorder;
    } else {
      solidBorderFullSize += sizeTakenByBorder;
    }
    resolvedBorders.push(resolvedBorder);
  }
  const rectangleWidth = availableWidth + outsideBorderFullSize * 2;
  const rectangleHeight = availableHeight + outsideBorderFullSize * 2;
  for (const resolvedBorder of resolvedBorders) {
    let { width = "50%", height = "50%", minWidth, minHeight } = resolvedBorder;
    let [cornerWidth, cornerHeight] = resolveDimensions({
      width,
      height,
      availableWidth: rectangleWidth,
      availableHeight: rectangleHeight,
      fontSize,
    });
    minWidth = resolveSize(minWidth, {
      availableSize: rectangleWidth,
      fontSize,
    });
    if (minWidth && cornerWidth < minWidth) {
      cornerWidth = minWidth;
    }
    minHeight = resolveSize(minHeight, {
      availableSize: rectangleHeight,
      fontSize,
    });
    if (minHeight && cornerHeight < minHeight) {
      cornerHeight = minHeight;
    }
    resolvedBorder.width = cornerWidth;
    resolvedBorder.height = cornerHeight;
  }

  return [
    resolvedBorders,
    rectangleWidth,
    rectangleHeight,
    borderFullSize,
    solidBorderFullSize,
    resolvedBorders.length ? resolvedBorders[0].radius : 0,
  ];
};

export const MultiBorder = ({ borders, borderFullSize, width, height }) => {
  if (borders.length === 0) {
    return null;
  }

  const children = [];
  let index = 0;
  let remainingWidth = width;
  let remainingHeight = height;
  let x = 0;
  let y = 0;
  for (const border of borders) {
    children.push(
      <Corners
        key={index}
        {...border}
        x={x}
        y={y}
        rectangleWidth={remainingWidth}
        rectangleHeight={remainingHeight}
      />,
    );
    const sizeTakenByBorder = border.size + border.spacing;
    x += sizeTakenByBorder;
    y += sizeTakenByBorder;
    remainingWidth -= sizeTakenByBorder * 2;
    remainingHeight -= sizeTakenByBorder * 2;
    index++;
  }
  return (
    <div
      name="multi_border"
      style={{
        position: "absolute",
        inset: `-${borderFullSize}px`,
      }}
    >
      <svg style={{ overflow: "visible" }} width={width} height={height}>
        {children}
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
