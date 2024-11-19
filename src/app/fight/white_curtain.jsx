import { useLayoutEffect, useRef } from "preact/hooks";

export const WhiteCurtain = ({
  visible,
  opacity = 0.5,
  elementRef = useRef(),
  ...props
}) => {
  useLayoutEffect(() => {
    const canvas = elementRef.current;
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

  return (
    <canvas
      {...props}
      ref={elementRef}
      className="white_curtain"
      style={{
        width: "100%",
        height: "100%",
        display: visible ? "block" : "none",
        position: "absolute",
        left: 0,
        top: 0,
      }}
    />
  );
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
