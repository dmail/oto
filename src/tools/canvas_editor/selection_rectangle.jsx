import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";

export const SelectionRectangle = ({ drawZoneRef, enabled }) => {
  const [x, xSetter] = useState(0);
  const [y, ySetter] = useState(0);
  const [width, widthSetter] = useState(0);
  const [height, heightSetter] = useState(0);
  const selectionRectangleCanvasRef = useRef();
  const moveStartInfoRef = useRef();

  const [interactedOnce, interactedOnceSetter] = useState(false);
  const [mouseIsDown, mouseIsDownSetter] = useState(false);
  const [mouseInsideDrawZone, mouseInsideDrawZoneSetter] = useState(false);
  const [mouseRelativeX, mouseRelativeXSetter] = useState(-1);
  const [mouseRelativeY, mouseRelativeYSetter] = useState(-1);

  useEffect(() => {
    if (!enabled) {
      return null;
    }
    const drawZone = drawZoneRef.current;
    const onmousedown = (e) => {
      mouseIsDownSetter(true);
      interactedOnceSetter(true);
      e.preventDefault();
      const drawZoneRect = drawZone.getBoundingClientRect();
      const startX = Math.round(drawZoneRect.left);
      const startY = Math.round(drawZoneRect.top);
      const startRelativeX = e.clientX - startX;
      const startRelativeY = e.clientY - startY;
      moveStartInfoRef.current = {
        startX,
        startY,
        startRelativeX,
        startRelativeY,
      };
      mouseRelativeXSetter(startRelativeX);
      mouseRelativeYSetter(startRelativeY);
      xSetter(startRelativeX);
      widthSetter(1);
      ySetter(startRelativeY);
      heightSetter(1);
    };
    const onmousemove = (e) => {
      const drawZoneRect = drawZone.getBoundingClientRect();
      const moveStartInfo = moveStartInfoRef.current;
      if (!moveStartInfo) {
        const relativeX = e.clientX - drawZoneRect.left;
        const relativeY = e.clientY - drawZoneRect.top;
        mouseRelativeXSetter(relativeX);
        mouseRelativeYSetter(relativeY);
        return;
      }
      const { startX, startY, startRelativeX, startRelativeY } = moveStartInfo;
      const relativeX = e.clientX - startX;
      const relativeY = e.clientY - startY;
      mouseRelativeXSetter(relativeX);
      mouseRelativeYSetter(relativeY);
      const moveX = relativeX - startRelativeX;
      const moveY = relativeY - startRelativeY;
      if (relativeX > startRelativeX) {
        xSetter(startRelativeX);
        widthSetter(moveX);
      } else {
        xSetter(startRelativeX + moveX);
        widthSetter(-moveX);
      }
      if (relativeY > startRelativeY) {
        ySetter(startRelativeY);
        heightSetter(moveY);
      } else {
        ySetter(startRelativeY + moveY);
        heightSetter(-moveY);
      }
    };
    const onmouseup = () => {
      mouseIsDownSetter(false);
      moveStartInfoRef.current = null;
    };

    drawZone.addEventListener("mousedown", onmousedown);
    document.addEventListener("mousemove", onmousemove);
    document.addEventListener("mouseup", onmouseup);

    const onmouseenter = () => {
      mouseInsideDrawZoneSetter(true);
    };
    const onmouseleave = () => {
      mouseInsideDrawZoneSetter(false);
    };
    drawZone.addEventListener("mouseenter", onmouseenter);
    drawZone.addEventListener("mouseleave", onmouseleave);
    return () => {
      drawZone.removeEventListener("mousedown", onmousedown);
      document.removeEventListener("mousemove", onmousemove);
      document.removeEventListener("mouseup", onmouseup);

      drawZone.removeEventListener("mouseenter", onmouseenter);
      drawZone.removeEventListener("mouseleave", onmouseenter);
    };
  }, [enabled]);

  useLayoutEffect(() => {
    const selectionRectangleCanvas = selectionRectangleCanvasRef.current;
    const context = selectionRectangleCanvas.getContext("2d");
    selectionRectangleCanvas.width = selectionRectangleCanvas.offsetWidth;
    selectionRectangleCanvas.height = selectionRectangleCanvas.offsetHeight;
    context.clearRect(
      0,
      0,
      selectionRectangleCanvas.width,
      selectionRectangleCanvas.height,
    );
    if (!enabled) {
      return;
    }
    context.save();
    context.beginPath();
    context.rect(x, y, width, height);
    context.globalAlpha = 0.8;
    context.lineWidth = 1;
    context.strokeStyle = "orange";
    context.stroke();
    context.closePath();
    context.restore();
  }, [enabled, x, y, width, height]);

  return (
    <>
      <div
        name="mouse_xy"
        style={{
          display:
            enabled && !mouseIsDown && mouseInsideDrawZone ? "block" : "none",
          position: "absolute",
          left: `${mouseRelativeX}px`,
          top: `${mouseRelativeY}px`,
          fontSize: "10px",
        }}
      >
        <span style={{ backgroundColor: "white" }}>{mouseRelativeX}</span>
        <br />
        <span style={{ backgroundColor: "white" }}>{mouseRelativeY}</span>
      </div>
      <div
        name="rectangle_xy"
        style={{
          display: enabled && interactedOnce ? "block" : "none",
          position: "absolute",
          left: `${x}px`,
          top: `${y}px`,
          fontSize: "10px",
        }}
      >
        <span style={{ backgroundColor: "white" }}>{x}</span>
        <br />
        <span style={{ backgroundColor: "white" }}>{y}</span>
      </div>
      <div
        name="rectangle_size"
        style={{
          display: enabled && interactedOnce ? "block" : "none",
          position: "absolute",
          left: `${x + width}px`,
          top: `${y + height}px`,
          fontSize: "10px",
        }}
      >
        <span style={{ backgroundColor: "white" }}>{width}</span>
        <br />
        <span style={{ backgroundColor: "white" }}>{height}</span>
      </div>
      <canvas
        ref={selectionRectangleCanvasRef}
        style={{
          pointerEvents: "none",
          position: "absolute",
          left: "0",
          width: "100%",
          height: "100%",
        }}
      ></canvas>
    </>
  );
};
