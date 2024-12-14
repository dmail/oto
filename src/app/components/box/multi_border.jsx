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
        context.lineWidth = borderSize;
        context.beginPath();
        buildBorderPath(context, {
          left,
          top,
          width: availableWidth,
          height: availableHeight,
          size: borderSize,
        });
        context.closePath();
        context.strokeStyle = border.color;
        context.stroke();
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

const buildBorderPath = (context, { left, top, width, height, size }) => {
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

  moveTo(left + size / 2, top + size / 2);
  lineX(width - size / 2);
  lineY(height - size / 2);
  lineX(left + size / 2);
  lineY(top + size / 2);
};
