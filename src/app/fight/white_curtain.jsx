import { useLayoutEffect } from "preact/hooks";
import { useCanvasRef } from "../canvas/use_canvas_ref.jsx";

export const WhiteCurtain = ({ style, opacity = 0.5 }) => {
  const canvasRef = useCanvasRef();

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    context.clearRect(0, 0, width, height);
    context.save();
    context.beginPath();
    context.rect(0, 0, width, height);
    context.closePath();
    context.globalAlpha = opacity;
    context.fillStyle = "white";
    context.fill();
    context.restore();
  }, [opacity]);

  return <canvas style={style} className="white_curtain" ref={canvasRef} />;
};

// const startClosingCurtain = (canvas) => {
//   // let startMs = Date.now();
//   const drawCurtain = (progress) => {
//     const y = height - progress * height;
//     console.log({ progress, y, width: canvas.width });
//   };

//   // const interval = setInterval(() => {
//   //   const nowMs = Date.now();
//   //   const msEllapsed = nowMs - startMs;
//   //   if (msEllapsed > duration) {
//   //     clearInterval(interval);
//   //     drawCurtain(1);
//   //     onFinish();
//   //   } else {
//   //     drawCurtain(msEllapsed / duration);
//   //   }
//   // }, 100);
//   drawCurtain(1);
// };
