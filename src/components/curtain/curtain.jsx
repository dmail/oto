import { animateNumber } from "animation";
import { forwardRef } from "preact/compat";
import { useEffect, useImperativeHandle, useRef, useState } from "preact/hooks";

export const Curtain = forwardRef((props, ref) => {
  const innerRef = useRef();
  const [visible, visibleSetter] = useState(false);
  const cleanupRef = useRef(null);

  const setCleanup = (value = null) => {
    const cleanup = cleanupRef.current;
    if (cleanup) {
      cleanup();
      cleanupRef.current = value;
    }
  };

  useImperativeHandle(ref, () => {
    const hide = () => {
      visibleSetter(false);
    };

    return {
      fadeIn: ({ color = "black", fromOpacity = 0, toOpacity = 1 } = {}) => {
        setCleanup(null);
        visibleSetter(true);
        const opacityAnimation = animateNumber({
          from: fromOpacity,
          to: toOpacity,
          effect: (opacity) => {
            drawCurtain(innerRef.current, { color, opacity });
          },
        });
        setCleanup(() => {
          opacityAnimation.cancel();
        });
      },
      show: ({ color = "white", opacity = 0.5, autoHideMs } = {}) => {
        setCleanup(null);
        drawCurtain(innerRef.current, { color, opacity });
        visibleSetter(true);
        if (autoHideMs) {
          const hideTimeout = setTimeout(() => {
            setCleanup(null);
            hide();
          }, autoHideMs);
          setCleanup(() => {
            clearTimeout(hideTimeout);
          });
        }
      },
      hide,
    };
  });

  useEffect(() => {
    return () => {
      setCleanup(null);
    };
  }, []);

  return (
    <canvas
      {...props}
      ref={innerRef}
      name="curtain"
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
