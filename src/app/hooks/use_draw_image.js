import { useLayoutEffect } from "preact/hooks";

export const useDrawImage = (
  canvasRef,
  source,
  { x = 0, y = 0, width, height, onDraw, debug } = {},
) => {
  useLayoutEffect(() => {
    if (!source) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (width === undefined) width = canvas.width;
    if (height === undefined) height = canvas.height;
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
  }, [source, x, y, width, height, onDraw]);
};
