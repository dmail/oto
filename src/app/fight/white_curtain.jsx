import { useLayoutEffect } from "preact/hooks";
import { useCanvasRef } from "../canvas/use_canvas_ref.jsx";

export const WhiteCurtain = ({ style, duration = 300, onFinish }) => {
  const canvasRef = useCanvasRef();

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    return startClosingCurtain(canvas, { duration, onFinish });
  }, []);

  return <canvas style={style} className="sprite" ref={canvasRef} />;
};

const startClosingCurtain = (canvas, { duration, onFinish = () => {} }) => {
  const context = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  console.log(canvas.width);

  let startMs = Date.now();
  const drawCurtain = (progress) => {
    const y = progress * height;
    console.log({ progress, y });
    context.clearRect(0, 0, width, height);
    context.save();
    context.beginPath();
    context.rect(0, y, width, height - y);
    context.closePath();
    context.globalAlpha = 0.7;
    context.fillStyle = "white";
    context.fill();
    context.restore();
  };

  const interval = setInterval(() => {
    const nowMs = Date.now();
    const msEllapsed = nowMs - startMs;
    if (msEllapsed > duration) {
      clearInterval(interval);
      drawCurtain(1);
      onFinish();
    } else {
      drawCurtain(duration / msEllapsed);
    }
    drawCurtain(0);
  }, 100);
  drawCurtain();
  return () => {
    clearInterval(interval);
  };
};
