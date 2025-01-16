import { forwardRef } from "preact/compat";
import { useImperativeHandle, useRef } from "preact/hooks";
import { animateElement, animateSequence } from "/animations/animation.js";

export const Curtain = forwardRef((props, ref) => {
  const innerRef = useRef();

  useImperativeHandle(ref, () => {
    return {
      fadeIn: async ({
        color = "black",
        fromOpacity = 0,
        toOpacity = 1,
      } = {}) => {
        await animateElement(innerRef.current, {
          from: { opacity: fromOpacity },
          to: { opacity: toOpacity },
          effect: ({ opacity }) => {
            drawCurtain(innerRef.current, { color, opacity });
          },
        });
      },
      show: async ({ color = "white", opacity = 0.5, autoHideMs } = {}) => {
        await animateSequence([
          () => {
            return animateElement(innerRef.current, {
              from: { display: "none" },
              to: { display: "block" },
              duration: 0,
              effect: () => {
                drawCurtain(innerRef.current, { color, opacity });
              },
            });
          },
          ...(autoHideMs
            ? [
                () => {
                  return animateElement(innerRef.current, {
                    to: { display: "none" },
                    delay: autoHideMs,
                    duration: 0,
                  });
                },
              ]
            : []),
        ]).finished;
      },
      hide: () => {
        animateElement(innerRef.current, {
          to: { display: "none" },
          duration: 0,
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
