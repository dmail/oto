import { useLayoutEffect, useRef } from "preact/hooks";

export const MultiBorder = ({ borders }) => {
  const canvasRef = useRef();
  let fullSize = borders.reduce((acc, border) => acc + border.size, 0);
  const deps = [];
  for (const border of borders) {
    deps.push(border.size, border.color, border.radius);
  }
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.imageSmoothingEnabled = false;
    const canvasParentNode = canvas.parentNode;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      let [availableWidth, availableHeight] = [
        canvasParentNode.offsetWidth,
        canvasParentNode.offsetHeight,
      ];
      canvas.width = `${availableWidth}`;
      canvas.height = `${availableHeight}`;
      context.clearRect(0, 0, canvas.width, canvas.height);

      let sizeConsumed = 0;
      let width = availableWidth / 2;
      let height = availableHeight / 2;
      let remainingWidth = availableWidth;
      let remainingHeight = availableHeight;
      for (const border of borders) {
        const borderSize = border.size;
        const borderRadius = border.radius || 0;
        let radius = borderRadius;
        if (sizeConsumed > 0) {
          radius -= sizeConsumed / 2;
          radius -= borderSize / 2;
          radius = Math.floor(radius); // to avoid eventuals gaps leading to white pixels
        }
        drawCorners(context, {
          x: sizeConsumed,
          y: sizeConsumed,
          width: width - sizeConsumed,
          height: height - sizeConsumed,
          size: borderSize,
          radius: Math.max(radius, 0),
          color: border.color,
          opacity: border.opacity,
          availableWidth: remainingWidth,
          availableHeight: remainingHeight,
        });
        remainingWidth -= borderSize * 2;
        remainingHeight -= borderSize * 2;
        sizeConsumed += borderSize;
      }
    });
    observer.observe(canvasParentNode);
    return () => {
      observer.disconnect();
    };
  }, deps);

  return (
    <canvas
      ref={canvasRef}
      name="multi_border"
      style={{
        position: "absolute",
        inset: `-${fullSize}px`,
      }}
    ></canvas>
  );
};

const drawCorners = (
  context,
  {
    x,
    y,
    width,
    height,
    size,
    radius,
    color,
    opacity,
    availableWidth,
    availableHeight,
  },
) => {
  drawTopLeftCorner(context, {
    x,
    y,
    width,
    height,
    size,
    radius,
    color,
    opacity,
  });
  drawTopRightCorner(context, {
    x: x + availableWidth,
    y,
    width,
    height,
    size,
    radius,
    color,
    opacity,
  });
  drawBottomRightCorner(context, {
    x: x + availableWidth,
    y: y + availableHeight,
    width,
    height,
    size,
    radius,
    color,
    opacity,
  });
  drawBottomLeftCorner(context, {
    x,
    y: y + availableHeight,
    width,
    height,
    size,
    radius,
    color,
    opacity,
  });
};
const drawTopLeftCorner = (
  context,
  { x, y, width, height, size, radius, color, opacity = 1 },
) => {
  context.lineWidth = size;
  context.globalAlpha = opacity;
  const leftLineStart = [
    x + size / 2,
    radius === 0 ? y : y + radius + size / 2,
  ];
  const leftLineEnd = [x + size / 2, y + height];
  const topLineStart = [x + radius + size / 2, y + size / 2];
  const topLineEnd = [x + width, y + size / 2];
  const controlPoint = [x + size / 2, y + size / 2];
  if (leftLineStart[1] < leftLineEnd[1]) {
    drawLine(context, leftLineStart, leftLineEnd, {
      color,
    });
  }
  if (radius !== 0) {
    drawArcTo(context, leftLineStart, controlPoint, topLineStart, radius, {
      color,
    });
  }
  if (topLineStart[0] < topLineEnd[0]) {
    drawLine(context, [topLineStart[0] - 1, topLineStart[1]], topLineEnd, {
      color,
    });
  }
};
const drawTopRightCorner = (
  context,
  { x, y, width, height, size, radius, color, opacity = 1 },
) => {
  context.lineWidth = size;
  context.globalAlpha = opacity;
  const topLineStart = [x - width, y + size / 2];
  const topLineEnd = [radius === 0 ? x : x - radius - size / 2, y + size / 2];
  const rightLineStart = [x - size / 2, y + radius + size / 2];
  const rightLineEnd = [x - size / 2, y + height];
  const controlPoint = [x - size / 2, y + size / 2];
  if (topLineStart[0] < topLineEnd[0]) {
    drawLine(context, topLineStart, topLineEnd, { color });
  }
  if (radius !== 0) {
    drawArcTo(context, topLineEnd, controlPoint, rightLineStart, radius, {
      color,
    });
  }
  if (rightLineStart[1] < rightLineEnd[1]) {
    drawLine(context, rightLineStart, rightLineEnd, { color });
  }
};
const drawBottomRightCorner = (
  context,
  { x, y, width, height, size, radius, color, opacity },
) => {
  context.lineWidth = size;
  context.globalAlpha = opacity;
  const rightLineStart = [x - size / 2, y - height];
  const rightLineEnd = [x - size / 2, radius === 0 ? y : y - radius - size / 2];
  const bottomLineStart = [x - radius - size / 2, y - size / 2];
  const bottomLineEnd = [x - width, y - size / 2];
  const controlPoint = [x - size / 2, y - size / 2];
  if (rightLineStart[1] < rightLineEnd[1]) {
    drawLine(context, rightLineStart, rightLineEnd, { color });
  }
  if (radius !== 0) {
    drawArcTo(context, rightLineEnd, controlPoint, bottomLineStart, radius, {
      color,
    });
  }
  if (bottomLineStart[0] > bottomLineEnd[0]) {
    drawLine(context, bottomLineStart, bottomLineEnd, { color });
  }
};
const drawBottomLeftCorner = (
  context,
  { x, y, width, height, size, radius, color, opacity = 1 },
) => {
  context.lineWidth = size;
  context.globalAlpha = opacity;
  const leftLineStart = [x + size / 2, y - height];
  const leftLineEnd = [x + size / 2, y - radius - size / 2];
  const bottomLineStart = [
    radius === 0 ? x : x + radius + size / 2,
    y - size / 2,
  ];
  const bottomLineEnd = [x + width, y - size / 2];
  const controlPoint = [x + size / 2, y - size / 2];
  if (leftLineStart[1] < leftLineEnd[1]) {
    drawLine(context, leftLineStart, leftLineEnd, { color });
  }
  if (radius !== 0) {
    drawArcTo(context, leftLineEnd, controlPoint, bottomLineStart, radius, {
      color,
    });
  }
  if (bottomLineStart[0] < bottomLineEnd[0]) {
    drawLine(context, bottomLineStart, bottomLineEnd, { color });
  }
};

const drawLine = (context, start, end, { color } = {}) => {
  context.beginPath();
  context.moveTo(start[0], start[1]);
  context.lineTo(end[0], end[1]);
  if (color) {
    context.strokeStyle = color;
    context.stroke();
  }
};
// const drawRect = (context, start, end, { color }) => {
//   context.beginPath();
//   context.rect(start[0], start[1], end[0] - start[0], end[1] - start[1]);
//   if (color) {
//     context.strokeStyle = color;
//     context.stroke();
//   }
// };
const drawArcTo = (
  context,
  start,
  controlPoint,
  end,
  radius,
  { color } = {},
) => {
  context.beginPath();
  let [startX, startY] = start;
  let [controlX, controlY] = controlPoint;
  let [endX, endY] = end;
  const controlXDecimal = controlX % 1;
  const controlYDecimal = controlY % 1;
  if (controlXDecimal) {
    if (controlX > startX) {
      controlX = Math.ceil(controlX);
      startX -= controlXDecimal;
    } else {
      controlX = Math.floor(controlX);
    }
  }
  if (controlYDecimal) {
    if (controlY > startY) {
      controlY = Math.ceil(controlY);
      startY -= controlYDecimal;
    } else {
      controlY = Math.floor(controlY);
    }
  }
  context.moveTo(startX, startY);
  context.arcTo(controlX, controlY, endX, endY, radius);
  if (color) {
    context.strokeStyle = color;
    context.stroke();
  }
};
