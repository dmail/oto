import { useLayoutEffect } from "preact/hooks";

export const useDrawImage = (
  canvas,
  source,
  { x = 0, y = 0, width, opacity = 1, height, onDraw, debug } = {},
) => {
  useLayoutEffect(() => {
    if (!canvas) return;
    if (typeof source === "function") source = source();
    if (!source) return;
    const context = canvas.getContext("2d");
    if (width === undefined) {
      width = canvas.width;
    } else {
      canvas.width = width;
    }
    if (height === undefined) {
      height = canvas.height;
    } else {
      canvas.height = height;
    }
    context.clearRect(0, 0, width, height);
    const imageWidth =
      source.nodeName === "IMG" ? source.naturalWidth : source.width;
    const imageHeight =
      source.nodeName === "IMG" ? source.naturalHeight : source.height;
    if (debug) {
      console.log("draw image", {
        sx: x,
        sy: y,
        sWidth: imageWidth,
        sHeight: imageHeight,
        dx: 0,
        dy: 0,
        dWidth: width,
        dHeight: height,
      });
    }
    context.globalAlpha = opacity;
    context.drawImage(
      source,
      x,
      y,
      imageWidth,
      imageHeight,
      0,
      0,
      width,
      height,
    );
    if (onDraw) {
      onDraw();
    }
  }, [canvas, source, x, y, width, height, opacity, onDraw]);
};
