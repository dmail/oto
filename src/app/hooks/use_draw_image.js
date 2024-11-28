import { useLayoutEffect } from "preact/hooks";

export const useDrawImage = (
  canvasRef,
  image,
  { x = 0, y = 0, width, height, onDraw, debug } = {},
) => {
  useLayoutEffect(() => {
    if (!image) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (width === undefined) width = canvas.width;
    if (height === undefined) height = canvas.height;
    context.clearRect(0, 0, width, height);
    const imageWidth = image.naturalWidth;
    const imageHeight = image.naturalHeight;
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
      image,
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
  }, [image, x, y, width, height, onDraw]);
};
