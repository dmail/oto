import { useLayoutEffect, useRef } from "preact/hooks";

export const useCanvasRef = () => {
  const canvasRef = useRef();
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
  }, []);

  return canvasRef;
};
