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

      let left = 0;
      let top = 0;
      for (const border of borders) {
        const borderSize = border.size;
        const borderRadius = border.radius;
        drawBorderPath(context, {
          left,
          top,
          width: availableWidth,
          height: availableHeight,
          size: borderSize,
          radius: borderRadius,
          color: border.color,
        });
        left += borderSize;
        top += borderSize;
        availableWidth -= borderSize;
        availableHeight -= borderSize;
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

// const drawRoundRect = (context, { x, y, width, height, radius = 5 }) => {
//   context.beginPath();
//   context.moveTo(x + radius, y);
//   context.lineTo(x + width - radius, y);
//   context.quadraticCurveTo(x + width, y, x + width, y + radius);
//   context.lineTo(x + width, y + height - radius);
//   context.quadraticCurveTo(
//     x + width,
//     y + height,
//     x + width - radius,
//     y + height,
//   );
//   context.lineTo(x + radius, y + height);
//   context.quadraticCurveTo(x, y + height, x, y + height - radius);
//   context.lineTo(x, y + radius);
//   context.quadraticCurveTo(x, y, x + radius, y);
//   context.closePath();
// };

const drawBorderPath = (context, { left, top, width, height, size, color }) => {
  let x;
  let y;
  const moveTo = (_x, _y) => {
    x = _x;
    y = _y;
    context.moveTo(x, y);
  };
  const lineX = (_x) => {
    x = _x;
    context.lineTo(x, y);
  };
  const lineY = (_y) => {
    y = _y;
    context.lineTo(x, y);
  };

  context.beginPath();
  context.lineWidth = size;
  moveTo(left + size / 2, top + size / 2);
  lineX(width - size / 2);
  lineY(height - size / 2);
  lineX(left + size / 2);
  lineY(top + size / 2);
  context.closePath();
  if (color) {
    context.strokeStyle = color;
    context.stroke();
  }
};
