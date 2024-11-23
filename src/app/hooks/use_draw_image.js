import { useLayoutEffect } from "preact/hooks";

export const useDrawImage = (canvasRef, image) => {
  useLayoutEffect(() => {
    if (!image) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);
  }, [image]);
};
