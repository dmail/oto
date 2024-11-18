import { render } from "preact";
import { useRef, useLayoutEffect, useState } from "preact/hooks";
import { signal, useSignalEffect } from "@preact/signals";

const imageUrlLocalStorageKey = "image_data";
const imageUrlFacade = {
  localStorageKey: "image_data",
  signal: signal(),
  set: (url) => {
    localStorage.setItem(imageUrlLocalStorageKey, url);
    imageUrlFacade.signal.value = url;
  },
};
const imageUrl = localStorage.getItem(imageUrlLocalStorageKey);
if (imageUrl !== null) {
  imageUrlFacade.signal.value = imageUrl;
}

const selectionRectangleFacade = {
  borderColor: "orange",
  signal: signal(),
};

const SpritesheetPicker = () => {
  const canvasRef = useRef();
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }, []);
  useSignalEffect(() => {
    const imageUrl = imageUrlFacade.signal.value;
    if (!imageUrl) {
      return;
    }
    const image = new Image();
    image.src = imageUrl;
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0);
      imageUrlFacade.set(canvas.toDataURL());
    };
  });

  const selectionRectangleCanvasRef = useRef();
  useLayoutEffect(() => {
    const selectionRectangleCanvas = selectionRectangleCanvasRef.current;
    selectionRectangleCanvas.width = selectionRectangleCanvas.offsetWidth;
    selectionRectangleCanvas.height = selectionRectangleCanvas.offsetHeight;
  }, []);
  useSignalEffect(() => {
    const selectionRectangleCanvas = selectionRectangleCanvasRef.current;
    const context = selectionRectangleCanvas.getContext("2d");
    const selectionRectangle = selectionRectangleFacade.signal.value;
    context.clearRect(
      0,
      0,
      selectionRectangleCanvas.width,
      selectionRectangleCanvas.height,
    );
    if (!selectionRectangle) {
      return;
    }
    context.save();
    context.beginPath();
    context.rect(
      selectionRectangle.x,
      selectionRectangle.y,
      selectionRectangle.width,
      selectionRectangle.height,
    );
    context.globalAlpha = 0.8;
    context.lineWidth = 1;
    context.strokeStyle = selectionRectangleFacade.borderColor;
    context.stroke();
    context.closePath();
    context.restore();
  });
  const [mousemoveOrigin, mousemoveOriginSetter] = useState();
  const [colorAt, colorAtSetter] = useState();

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <div
        style={{
          width: "400px",
          height: "400px",
          border: "1px solid black",
          position: "relative",
        }}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.items[0].getAsFile();
          const objectUrl = URL.createObjectURL(file);
          imageUrlFacade.set(objectUrl);
        }}
        onMouseDown={(e) => {
          const canvas = canvasRef.current;
          const context = canvas.getContext("2d", { willReadFrequently: true });
          const pixel = context.getImageData(e.offsetX, e.offsetY, 1, 1).data;
          colorAtSetter(`${pixel[0]},${pixel[1]},${pixel[2]}`);

          mousemoveOriginSetter({
            x: e.offsetX,
            y: e.offsetY,
          });
          const onmouseup = () => {
            mousemoveOriginSetter(null);
            document.removeEventListener("mouseup", onmouseup);
          };
          document.addEventListener("mouseup", onmouseup);
        }}
        onMouseMove={(e) => {
          if (!mousemoveOrigin) {
            return;
          }
          const originX = mousemoveOrigin.x;
          const originY = mousemoveOrigin.y;
          const mouseX = e.offsetX;
          const mouseY = e.offsetY;
          const selectionRectangle = {};
          if (mouseX < originX) {
            selectionRectangle.x = mouseX;
            selectionRectangle.width = originX - mouseX;
          } else {
            selectionRectangle.x = originX;
            selectionRectangle.width = mouseX - originX;
          }
          if (mouseY < originY) {
            selectionRectangle.y = mouseY;
            selectionRectangle.height = originY - mouseY;
          } else {
            selectionRectangle.y = originY;
            selectionRectangle.height = mouseY - originY;
          }
          selectionRectangleFacade.signal.value = selectionRectangle;
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%" }}
        ></canvas>
        <canvas
          ref={selectionRectangleCanvasRef}
          style={{
            position: "absolute",
            left: "0",
            width: "100%",
            height: "100%",
          }}
        ></canvas>
      </div>
      <div
        style={{
          width: "400px",
          height: "200px",
          border: "1px solid black",
          marginLeft: "10px",
        }}
      >
        <fieldset>
          <legend>Selection</legend>
          X:
          <input
            type="number"
            value={selectionRectangleFacade.signal.value?.x}
            readOnly
          ></input>
          <br />
          Y:
          <input
            type="number"
            value={selectionRectangleFacade.signal.value?.y}
            readOnly
          ></input>
          <br />
          width:
          <input
            type="number"
            value={selectionRectangleFacade.signal.value?.width}
            onInput={(e) => {
              selectionRectangleFacade.signal.value = {
                ...selectionRectangleFacade.signal.value,
                width: e.target.value,
              };
            }}
          ></input>
          <br />
          height:
          <input
            type="number"
            value={selectionRectangleFacade.signal.value?.height}
            readOnly
          ></input>
        </fieldset>
        <fieldset>
          <legend>
            Color at {mousemoveOrigin?.x},{mousemoveOrigin?.y}
          </legend>
          {colorAt}
        </fieldset>
      </div>
    </div>
  );
};

render(<SpritesheetPicker />, document.querySelector("#root"));
