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
    let { size = 1, strokeSize = 0, radius = 0, spacing = 0 } = border;
    const resolvedBorder = {
      ...border,
      strokeSize,
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
    const sizeTakenByBorder =
      resolvedBorder.size + resolvedBorder.strokeSize + resolvedBorder.spacing;
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
  let remainingWidth = rectangleWidth;
  let remainingHeight = rectangleHeight;
  let x = 0;
  let y = 0;

  for (const resolvedBorder of resolvedBorders) {
    let { width = "50%", height = "50%", minWidth, minHeight } = resolvedBorder;
    let [cornerWidth, cornerHeight] = resolveDimensions({
      width,
      height,
      availableWidth: remainingWidth,
      availableHeight: remainingHeight,
      fontSize,
    });
    minWidth = resolveSize(minWidth, {
      availableSize: remainingWidth,
      fontSize,
    });
    if (minWidth && cornerWidth < minWidth) {
      cornerWidth = minWidth;
    }
    minHeight = resolveSize(minHeight, {
      availableSize: remainingHeight,
      fontSize,
    });
    if (minHeight && cornerHeight < minHeight) {
      cornerHeight = minHeight;
    }
    resolvedBorder.width = cornerWidth;
    resolvedBorder.height = cornerHeight;
    resolvedBorder.x = x;
    resolvedBorder.y = y;
    resolvedBorder.rectangleWidth = remainingWidth;
    resolvedBorder.rectangleHeight = remainingHeight;

    const sizeTakenByBorder =
      resolvedBorder.size + resolvedBorder.strokeSize + resolvedBorder.spacing;
    x += sizeTakenByBorder;
    y += sizeTakenByBorder;
    remainingWidth -= sizeTakenByBorder * 2;
    remainingHeight -= sizeTakenByBorder * 2;
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
  for (const border of borders) {
    children.push(<Corners key={index} {...border} />);
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
    <g name="corners" data-radius={radius} data-size={size}>
      {/* <TopLeftCorner
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
      /> */}
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

const Corner = ({
  name,
  buildPath,
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
  if (strokeSize) {
    let strokeWidth;
    let strokeHeight;
    let fillX;
    let fillY;
    if (name === "top_left") {
      strokeWidth = width + strokeSize;
      strokeHeight = height + strokeSize;
      fillX = x + strokeSize / 2;
      fillY = y + strokeSize / 2;
    } else if (name === "top_right") {
      strokeWidth = width + strokeSize;
      strokeHeight = height + strokeSize;
      fillX = x - strokeSize / 2;
      fillY = y + strokeSize / 2;
    } else if (name === "bottom_right") {
      strokeWidth = width + strokeSize;
      strokeHeight = height + strokeSize;
      fillX = x - strokeSize / 2;
      fillY = y - strokeSize / 2;
    } else if (name === "bottom_left") {
      strokeWidth = width + strokeSize;
      strokeHeight = height + strokeSize;
      fillX = x + strokeSize / 2;
      fillY = y - strokeSize / 2;
    }

    const strokePath = buildPath({
      isStroke: true,
      x,
      y,
      width: strokeWidth,
      height: strokeHeight,
      size: size + strokeSize,
      radius,
    });
    const fillPath = buildPath({
      x: fillX,
      y: fillY,
      width,
      height,
      size,
      radius: radius - strokeSize / 2,
    });
    return (
      <>
        <path
          name={`${name}_corner_stroke`}
          d={strokePath}
          fill={strokeColor}
          opacity={opacity}
        />
        <path
          name={`${name}_corner_fill`}
          d={fillPath}
          fill={color}
          opacity={opacity}
        />
      </>
    );
  }
  const fillPath = buildPath({});
  return (
    <path
      name={`${name}_corner_fill`}
      d={fillPath}
      fill={color}
      opacity={opacity}
    />
  );
};

const TopLeftCorner = (props) => {
  return (
    <Corner name="top_left" buildPath={buildTopLeftCornerPath} {...props} />
  );
};
const TopRightCorner = (props) => {
  return (
    <Corner name="top_right" buildPath={buildTopRightCornerPath} {...props} />
  );
};
const BottomRightCorner = (props) => {
  return (
    <Corner
      name="bottom_right"
      buildPath={buildBottomRightCornerPath}
      {...props}
    />
  );
};
const BottomLeftCorner = (props) => {
  return (
    <Corner
      name="bottom_left"
      buildPath={buildBottomLeftCornerPath}
      {...props}
    />
  );
};

const buildTopLeftCornerPath = ({
  isStroke,
  x,
  y,
  width,
  height,
  size,
  radius,
}) => {
  if (size <= 0 || width <= 0 || height <= 0) {
    return null;
  }
  let sizeX = size;
  if (size > width) {
    sizeX = width;
  }
  let sizeY = size;
  if (size > height) {
    sizeY = height;
  }
  let d = [];
  if (radius > 0) {
    let outerRadiusX = radius;
    let outerRadiusY = radius;
    const leftLineHeight = height - outerRadiusY;
    const topLineWidth = width - outerRadiusX;
    if (leftLineHeight < 0) {
      const xDiff = -leftLineHeight;
      outerRadiusX += xDiff;
      if (!isStroke) {
        x += xDiff / 6;
      }
    }
    if (topLineWidth < 0) {
      const yDiff = -topLineWidth;
      outerRadiusY += yDiff;
      if (!isStroke) {
        y += yDiff / 6;
      }
    }
    let outerRadiusDX = Math.min(outerRadiusX, width);
    let outerRadiusDY = Math.min(outerRadiusY, height);
    let innerRadiusX = outerRadiusX - sizeX;
    let innerRadiusY = outerRadiusY - sizeY;

    d.push(`M ${x},${y + height}`);
    if (leftLineHeight > 0) {
      d.push(`v -${leftLineHeight}`);
    }
    d.push(
      `a ${outerRadiusX},${outerRadiusY} 0 0 1 ${outerRadiusDX},-${outerRadiusDY}`,
    );
    if (topLineWidth > 0) {
      d.push(`h ${topLineWidth}`);
    }
    if (innerRadiusX >= 1 && innerRadiusY >= 1) {
      const bottomLineWidth = width - sizeX - innerRadiusX;
      const rightLineHeight = height - sizeY - innerRadiusY;
      if (bottomLineWidth < 0) {
        const xDiff = -bottomLineWidth;
        innerRadiusX -= xDiff;
      }
      if (rightLineHeight < 0) {
        const yDiff = -rightLineHeight;
        innerRadiusY -= yDiff;
      }
      d.push(`v ${sizeY}`);
      if (bottomLineWidth > 0) {
        d.push(`h -${bottomLineWidth}`);
      }
      d.push(
        `a ${innerRadiusX},${innerRadiusY} 0 0 0 -${innerRadiusX},${innerRadiusY}`,
      );
      if (rightLineHeight > 0) {
        d.push(`v ${rightLineHeight}`);
      }
      d.push(`h -${sizeX}`);
    } else {
      d.push(
        `v ${sizeY}`,
        `h -${width - sizeX}`,
        `v ${height - sizeY}`,
        `h -${sizeX}`,
      );
    }
  } else {
    d.push(
      `M ${x},${y}`,
      `h ${width}`,
      `v ${size}`,
      `h -${width - size}`,
      `v ${height - size}`,
      `h -${size}`,
      `v -${height}`,
    );
  }
  d.push("z");
  d = d.join(" ");
  return d;
};
const buildTopRightCornerPath = ({
  isStroke,
  x,
  y,
  width,
  height,
  size,
  radius,
}) => {
  if (size <= 0 || width <= 0 || height <= 0) {
    return null;
  }
  let sizeX = size;
  if (size > width) {
    sizeX = width;
  }
  let sizeY = size;
  if (size > height) {
    sizeY = height;
  }
  let d = [];
  if (radius > 0) {
    let outerRadiusX = radius;
    let outerRadiusY = radius;
    const topLineWidth = width - outerRadiusX;
    const rightLineHeight = height - outerRadiusY;
    if (topLineWidth < 0) {
      const xDiff = -topLineWidth;
      outerRadiusX += xDiff;
      if (!isStroke) {
        x -= xDiff / 6;
      }
    }
    if (rightLineHeight < 0) {
      const yDiff = -rightLineHeight;
      outerRadiusY += yDiff;
      if (!isStroke) {
        y += yDiff / 6;
      }
    }
    let outerRadiusDX = Math.min(outerRadiusX, width);
    let outerRadiusDY = Math.min(outerRadiusY, height);
    let innerRadiusX = outerRadiusX - sizeX;
    let innerRadiusY = outerRadiusY - sizeY;

    d.push(`M ${x - width},${y}`);
    if (topLineWidth > 0) {
      d.push(`h ${topLineWidth}`);
    }
    d.push(
      `a ${outerRadiusX},${outerRadiusY} 0 0 1 ${outerRadiusDX},${outerRadiusDY}`,
    );
    if (rightLineHeight > 0) {
      d.push(`v ${rightLineHeight}`);
    }
    if (innerRadiusX >= 1 && innerRadiusY >= 1) {
      const leftLineHeight = height - sizeY - innerRadiusY;
      const bottomLineWidth = width - sizeX - innerRadiusX;
      if (leftLineHeight < 0) {
        const yDiff = -leftLineHeight;
        innerRadiusY -= yDiff;
      }
      if (bottomLineWidth < 0) {
        const xDiff = -bottomLineWidth;
        innerRadiusX -= xDiff;
      }
      d.push(`h -${sizeX}`);
      if (leftLineHeight > 0) {
        d.push(`v -${leftLineHeight}`);
      }
      d.push(
        `a ${innerRadiusX},${innerRadiusY} 0 0 0 -${innerRadiusX},-${innerRadiusY}`,
      );
      if (bottomLineWidth > 0) {
        d.push(`h -${bottomLineWidth}`);
      }
      d.push(`v -${sizeY}`);
    } else {
      d.push(`v -${height - size}`, `h ${-width + size}`, `v -${size}`);
    }
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
  d.push("z");
  d = d.join(" ");
  return d;
};
const buildBottomRightCornerPath = ({
  isStroke,
  x,
  y,
  width,
  height,
  size,
  radius,
}) => {
  if (size <= 0 || width <= 0 || height <= 0) {
    return null;
  }
  let sizeX = size;
  if (size > width) {
    sizeX = width;
  }
  let sizeY = size;
  if (size > height) {
    sizeY = height;
  }
  let d = [];
  if (radius > 0) {
    let outerRadiusX = radius;
    let outerRadiusY = radius;
    const rightLineHeight = height - outerRadiusY;
    const bottomLineWidth = width - outerRadiusX;
    if (rightLineHeight < 0) {
      const yDiff = -rightLineHeight;
      outerRadiusY += yDiff;
      if (!isStroke) {
        y -= yDiff / 6;
      }
    }
    if (bottomLineWidth < 0) {
      const xDiff = -bottomLineWidth;
      outerRadiusX += xDiff;
      if (!isStroke) {
        x -= xDiff / 6;
      }
    }
    let outerRadiusDX = Math.min(outerRadiusX, width);
    let outerRadiusDY = Math.min(outerRadiusY, height);
    let innerRadiusX = outerRadiusX - sizeX;
    let innerRadiusY = outerRadiusY - sizeY;

    d.push(`M ${x},${y - height}`);
    if (rightLineHeight > 0) {
      d.push(`v ${rightLineHeight}`);
    }
    d.push(
      `a ${outerRadiusX},${outerRadiusY} 0 0 1 -${outerRadiusDX},${outerRadiusDY}`,
    );
    if (bottomLineWidth > 0) {
      d.push(`h ${bottomLineWidth}`);
    }
    if (innerRadiusX >= 1 && innerRadiusY >= 1) {
      const topLineWidth = width - sizeX - innerRadiusX;
      const leftLineHeight = height - sizeY - innerRadiusY;
      if (topLineWidth < 0) {
        const xDiff = -topLineWidth;
        innerRadiusX -= xDiff;
      }
      if (leftLineHeight < 0) {
        const yDiff = -leftLineHeight;
        innerRadiusY -= yDiff;
      }
      d.push(`v -${sizeY}`);
      if (topLineWidth > 0) {
        d.push(`h -${topLineWidth}`);
      }
      d.push(
        `a ${innerRadiusX},${innerRadiusY} 0 0 0 ${innerRadiusX},-${innerRadiusY}`,
      );
      if (leftLineHeight > 0) {
        d.push(`v -${leftLineHeight}`);
      }
      d.push(`h ${sizeX}`);
    } else {
      d.push(
        `h ${sizeX}`,
        `v -${height - sizeY}`,
        `h ${width - sizeX}`,
        `v ${sizeY}`,
      );
    }
  } else {
    d.push(
      `M ${x - width},${y - height}`,
      `h ${width}`,
      `v ${size}`,
      `h -${width - size}`,
      `v ${height - size}`,
      `h -${size}`,
      `v -${height}`,
    );
  }
  d.push("z");
  d = d.join(" ");
  return d;
};
const buildBottomLeftCornerPath = ({
  isStroke,
  x,
  y,
  width,
  height,
  size,
  radius,
}) => {
  if (size <= 0 || width <= 0 || height <= 0) {
    return null;
  }
  let sizeX = size;
  if (size > width) {
    sizeX = width;
  }
  let sizeY = size;
  if (size > height) {
    sizeY = height;
  }
  let d = [];
  if (radius > 0) {
    let outerRadiusX = radius;
    let outerRadiusY = radius;
    const bottomLineWidth = width - outerRadiusX;
    const leftLineHeight = height - outerRadiusY;
    if (bottomLineWidth < 0) {
      const xDiff = -bottomLineWidth;
      outerRadiusX += xDiff;
      if (!isStroke) {
        x += xDiff / 6;
      }
    }
    if (leftLineHeight < 0) {
      const yDiff = -leftLineHeight;
      outerRadiusY += yDiff;
      if (!isStroke) {
        y -= yDiff / 6;
      }
    }
    let outerRadiusDX = Math.min(outerRadiusX, width);
    let outerRadiusDY = Math.min(outerRadiusY, height);
    let innerRadiusX = outerRadiusX - sizeX;
    let innerRadiusY = outerRadiusY - sizeY;

    d.push(`M ${x + width},${y}`);
    if (bottomLineWidth > 0) {
      d.push(`h -${bottomLineWidth}`);
    }
    d.push(
      `a ${outerRadiusX},${outerRadiusY} 0 0 1 -${outerRadiusDX},-${outerRadiusDY}`,
    );
    if (leftLineHeight > 0) {
      d.push(`v -${leftLineHeight}`);
    }
    if (innerRadiusX >= 1 && innerRadiusY >= 1) {
      const leftLineHeight = height - sizeY - innerRadiusY;
      const topLineWidth = width - sizeX - innerRadiusX;
      if (leftLineHeight < 0) {
        const yDiff = -leftLineHeight;
        innerRadiusY -= yDiff;
      }
      if (topLineWidth < 0) {
        const xDiff = -topLineWidth;
        innerRadiusX -= xDiff;
      }
      d.push(`h ${sizeX}`);
      if (leftLineHeight > 0) {
        d.push(`v ${leftLineHeight}`);
      }
      d.push(
        `a ${innerRadiusX},${innerRadiusY} 0 0 0 ${innerRadiusX},${innerRadiusY}`,
      );
      if (topLineWidth > 0) {
        d.push(`h ${topLineWidth}`);
      }
      d.push(`v ${sizeY}`);
    } else {
      d.push(
        `v -${sizeY}`,
        `h ${width - sizeX}`,
        `v -${height - sizeY}`,
        `h ${sizeX}`,
      );
    }
  } else {
    d.push(
      `M ${x},${y}`,
      `h ${size}`,
      `v ${height}`,
      `h -${size}`,
      `v -${height - size}`,
      `h -${width - size}`,
      `v ${size}`,
    );
  }
  d.push("z");
  d = d.join(" ");
  return d;
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
