import { forwardRef } from "preact/compat";
import { useImperativeHandle, useRef } from "preact/hooks";
import { ANIMATION } from "/animations/animation.js";

export const Curtain = forwardRef((props, ref) => {
  const innerRef = useRef();

  useImperativeHandle(ref, () => {
    return {
      show: ({ color = "white", opacity = 0.5 } = {}) => {
        const canvas = innerRef.current;
        drawCurtain(canvas, { color, opacity });
        ANIMATION.animateElement(canvas, {
          to: { display: "block", opacity },
          duration: 0,
        });
      },
      hide: () => {
        ANIMATION.animateElement(innerRef.current, {
          to: { display: "none" },
          duration: 0,
        });
      },
      fadeIn: async ({ color = "black", toOpacity = 1 } = {}) => {
        const canvas = innerRef.current;
        drawCurtain(canvas, { color, opacity: 1 });
        await ANIMATION.animateElement(canvas, {
          from: { display: "block" },
          to: { opacity: toOpacity },
        });
      },
      fadeOut: async ({ toOpacity = 0 } = {}) => {
        await ANIMATION.animateElement(innerRef.current, {
          to: { opacity: toOpacity },
        });
      },
    };
  });

  return (
    <canvas
      {...props}
      ref={innerRef}
      name="curtain"
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        display: "none",
        opacity: 0,
        left: 0,
        top: 0,
      }}
    />
  );
});

const drawCurtain = (canvas, { color, opacity }) => {
  const context = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  context.clearRect(0, 0, width, height);
  context.save();
  context.beginPath();
  context.rect(0, 0, width, height);
  context.closePath();
  context.globalAlpha = opacity;
  context.fillStyle = color;
  context.fill();
  context.restore();
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
