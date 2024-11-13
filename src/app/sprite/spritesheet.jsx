import { fromTransformations } from "matrix";
import { useLayoutEffect, useRef } from "preact/hooks";
import { useImage } from "../hooks/use_image.js";

export const SpriteSheet = ({
  url,
  transparentColor,
  x,
  y,
  width,
  height,
  mirrorX,
  mirrorY,
  blink,
}) => {
  const canvasRef = useRef();
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }, []);

  const [image] = useImage(url);
  useLayoutEffect(() => {
    if (!image) {
      return;
    }
    let source = image;
    if (transparentColor) {
      source = replaceColorWithTransparentPixels(image, transparentColor);
    }
    if (blink) {
      debugger;
      source = blinkSprite(source);
    }
    const transformations = {
      ...(mirrorX || mirrorY
        ? {
            flip: {
              x: mirrorX,
              y: mirrorY,
            },
            translate: {
              x: mirrorX ? -parseInt(width) : 0,
              y: mirrorY ? -parseInt(height) : 0,
            },
          }
        : {}),
    };
    const hasTransformations = Object.keys(transformations).length > 0;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    if (hasTransformations) {
      context.save();
      const matrix = fromTransformations(transformations);
      context.setTransform(...matrix);
      //  context.setTransform(-1, 0, 0, 1, parseInt(width), 0);
    }
    context.drawImage(
      source,
      parseInt(x),
      parseInt(y),
      parseInt(width),
      parseInt(height),
      0,
      0,
      canvas.offsetWidth,
      canvas.offsetHeight,
    );
    if (hasTransformations) {
      context.restore();
    }
  }, [image, blink, transparentColor, x, y, width, height]);

  return (
    <canvas
      className="sprite"
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
      }}
    ></canvas>
  );
};

const replaceColorWithTransparentPixels = (image, color) => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, image.width, image.height);
  const pixels = imageData.data;

  let shouldReplace;
  const [first] = color;
  if (typeof first === "object") {
    shouldReplace = (r, g, b) => {
      return color.some((c) => {
        return r === c[0] && g === c[1] && b === c[2];
      });
    };
  } else {
    const rToReplace = parseInt(color[0]);
    const gToReplace = parseInt(color[1]);
    const bToReplace = parseInt(color[2]);
    shouldReplace = (r, g, b) => {
      return r === rToReplace && g === gToReplace && b === bToReplace;
    };
  }

  for (let i = 0, n = pixels.length; i < n; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    if (shouldReplace(r, g, b)) {
      pixels[i + 3] = 0;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
};

const blinkSprite = (
  canvas,
  {
    x1 = 70, // x-coordinate of first circle
    y1 = 75, // y-coordinate of first circle
    x2 = 145, // x-coordinate of second circle
    y2 = y1,
  } = {},
) => {
  const buffer = document.createElement("canvas");
  buffer.width = canvas.width;
  buffer.height = canvas.height;

  const bufferContext = buffer.getContext("2d");
  const radgrad = bufferContext.createRadialGradient(x1, y1, 50, x1, y1, 40);
  const radgrad2 = bufferContext.createRadialGradient(x2, y2, 145, 50, y2, 40);

  bufferContext.fillStyle = "rgba(0,0,0,1)";
  bufferContext.fillRect(0, 0, canvas.width, canvas.height);
  bufferContext.save();
  bufferContext.globalCompositeOperation = "destination-out";

  // add ellipses
  bufferContext.beginPath();
  bufferContext.arc(x1, y1, 50, 0, Math.PI * 2, true);
  bufferContext.arc(x2, y2, 50, 0, Math.PI * 2, true);
  bufferContext.shadowBlur = 20;
  bufferContext.shadowColor = "black";

  radgrad.addColorStop(0, "rgba(0,0,0,0.1)");
  radgrad.addColorStop(0.2, `rgba(0, 0, 0, ${Math.random() + 0.2})`);
  radgrad.addColorStop(0.8, `rgba(0,0,0,${Math.random() + 0.8})`);
  radgrad.addColorStop(1, "rgba(0,0,0,1)");

  radgrad2.addColorStop(0, "rgba(0,0,0,0.1)");
  radgrad2.addColorStop(0.2, `rgba(0, 0, 0, ${Math.random() + 0.2})`);
  radgrad2.addColorStop(0.8, `rgba(0,0,0,${Math.random() + 0.8})`);
  radgrad2.addColorStop(1, "rgba(0,0,0,1)");

  bufferContext.fillStyle = radgrad;
  bufferContext.fill();
  bufferContext.fillStyle = radgrad2;
  bufferContext.fill();
  bufferContext.restore();

  return buffer;
};
