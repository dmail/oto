import { useLayoutEffect, useRef, useState } from "preact/hooks";

export const MultiBorder = ({ borders, children }) => {
  for (const border of borders.reverse()) {
    children = <CornersWrapper {...border}>{children}</CornersWrapper>;
  }
  return <>{children}</>;
};

const CornersWrapper = ({
  width = "50%",
  height = "50%",
  minWidth,
  minHeight,
  size,
  radius = 0,
  color,
  strokeColor,
  strokeSize = 0,
  opacity,
  outside,
  spacing = 0,
  children,
}) => {
  const svgRef = useRef();
  const divRef = useRef();
  const [availableWidth, setAvailableWidth] = useState(0);
  const [availableHeight, setAvailableHeight] = useState(0);
  const [fontSizeComputed, fontSizeComputedSetter] = useState(16);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    const elementToObserve = svg.parentNode;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      const availableWidth = elementToObserve.offsetWidth;
      const availableHeight = elementToObserve.offsetHeight;
      setAvailableWidth(availableWidth);
      setAvailableHeight(availableHeight);

      let { fontSize } = window.getComputedStyle(svg, null);
      fontSize = parseFloat(fontSize);
      fontSizeComputedSetter(fontSize);
    });
    observer.observe(elementToObserve);
    return () => {
      observer.disconnect();
    };
  }, []);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
    });
    observer.observe(svg);
    return () => {
      observer.disconnect();
    };
  }, []);

  const cornerSize = resolveSize(size, {
    availableSize: availableWidth,
    fontSize: fontSizeComputed,
  });
  let [cornerWidth, cornerHeight] = resolveDimensions({
    width,
    height,
    availableWidth,
    availableHeight,
    fontSize: fontSizeComputed,
  });
  minWidth = resolveSize(minWidth, {
    availableSize: availableWidth,
    fontSize: fontSizeComputed,
  });
  if (minWidth && cornerWidth < minWidth) {
    cornerWidth = minWidth;
  }
  minHeight = resolveSize(minHeight, {
    availableSize: availableHeight,
    fontSize: fontSizeComputed,
  });
  if (minHeight && cornerHeight < minHeight) {
    cornerHeight = minHeight;
  }
  spacing = resolveSize(spacing, {
    availableSize: availableWidth,
    fontSize: fontSizeComputed,
  });
  const cornerRadius = resolveSize(radius, {
    availableSize: availableWidth,
    fontSize: fontSizeComputed,
  });

  if (outside) {
    return (
      <>
        <div
          ref={divRef}
          style={{
            position: "absolute",
            zIndex: "-1",
            inset: `-${cornerSize + spacing + strokeSize}px`,
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
              size={cornerSize}
              radius={cornerRadius}
              color={color}
              opacity={opacity}
              strokeColor={strokeColor}
              strokeSize={strokeSize}
            />
          </svg>
        </div>
        {children}
      </>
    );
  }

  return (
    <div
      style={{
        borderWidth: `${cornerSize}px`,
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
          inset: `-${cornerSize}px`,
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
            size={cornerSize}
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
        x={rectangleWidth}
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
        x={rectangleWidth}
        y={rectangleHeight}
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
        y={rectangleHeight}
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
  if (size > width) {
    size = width;
  }
  if (size > height) {
    size = height;
  }
  let d;
  if (size === 0) {
    d = [];
  } else if (radius > 0) {
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
  if (size > width) {
    size = width;
  }
  if (size > height) {
    size = height;
  }

  let d;
  if (size === 0) {
    d = [];
  } else if (radius > 0) {
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
  if (size > width) {
    size = width;
  }
  if (size > height) {
    size = height;
  }

  let d;
  if (size === 0) {
    d = [];
  } else if (radius > 0) {
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
  if (size > width) {
    size = width;
  }
  if (size > height) {
    size = height;
  }

  let d;
  if (size === 0) {
    d = [];
  } else if (radius > 0) {
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
