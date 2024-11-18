import { effect, signal, useSignalEffect } from "@preact/signals";
import { render } from "preact";
import { useEffect, useLayoutEffect, useRef, useState } from "preact/hooks";

if (import.meta.hot) {
  import.meta.hot.decline();
}

const imageSignal = signal();
const loadImage = (url) => {
  imageSignal.value = null;
  localStorage.setItem("image_url", url);
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.onload = () => {
    imageSignal.value = image;
  };
  image.src = url;
};
const imageUrl = localStorage.getItem("image_url");
if (imageUrl !== null) {
  loadImage(imageUrl);
}

const zoomSignal = signal(1);
const initialZoom = localStorage.getItem("zoom");
if (initialZoom !== null) {
  zoomSignal.value = initialZoom;
}
const zoomIn = () => {
  zoomSignal.value++;
  localStorage.setItem("zoom", zoomSignal.value);
};
const zoomOut = () => {
  zoomSignal.value--;
  localStorage.setItem("zoom", zoomSignal.value);
};

const canvasXSignal = signal(0);
const initialCanvasX = localStorage.getItem("x");
if (initialCanvasX !== null) {
  canvasXSignal.value = parseInt(initialCanvasX);
}
effect(() => {
  const canvasX = canvasXSignal.value;
  localStorage.setItem("x", canvasX);
});
const canvasYSignal = signal(0);
const initialCanvasY = localStorage.getItem("y");
if (initialCanvasY !== null) {
  canvasYSignal.value = parseInt(initialCanvasY);
}
effect(() => {
  const canvasY = canvasYSignal.value;
  localStorage.setItem("y", canvasY);
});

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
    const image = imageSignal.value;
    const zoom = zoomSignal.value;
    const x = canvasXSignal.value;
    const y = canvasYSignal.value;
    if (!image) {
      return;
    }
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.clearRect(0, 0, canvas.width, canvas.height);
    const imageWidth = image.naturalWidth;
    const imageHeight = image.naturalHeight;
    const availableWidth = canvas.width * zoom;
    const availableHeight = canvas.height * zoom;
    context.drawImage(
      image,
      x,
      y,
      imageWidth,
      imageHeight,
      0,
      0,
      availableWidth,
      availableHeight,
    );
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
  const [grabKeyIsDown, grabKeyIsDownSetter] = useState(false);

  const startXRef = useRef(0);
  const startYRef = useRef(0);

  useEffect(() => {
    let removekeyup = () => {};
    const onkeydown = (keydownEvent) => {
      if (keydownEvent.metaKey) {
        grabKeyIsDownSetter(true);
      }
      removekeyup = () => {
        document.removeEventListener("keyup", onkeyup);
      };
      const onkeyup = (keyupEvent) => {
        if (!keyupEvent.metaKey) {
          grabKeyIsDownSetter(false);
          removekeyup();
        }
      };
      document.addEventListener("keyup", onkeyup);
    };
    document.addEventListener("keydown", onkeydown);
    return () => {
      document.removeEventListener("keydown", onkeydown);
      removekeyup();
    };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <div
        style={{
          width: "700px",
          height: "400px",
          border: "1px solid black",
          position: "relative",
          cursor: grabKeyIsDown ? "grab" : "default",
        }}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.items[0].getAsFile();
          const objectUrl = URL.createObjectURL(file);
          loadImage(objectUrl);
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
          startXRef.current = canvasXSignal.value;
          startYRef.current = canvasYSignal.value;
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

          const moveX = originX - mouseX;
          const moveY = originY - mouseY;
          if (grabKeyIsDown) {
            canvasXSignal.value = startXRef.current + moveX;
            canvasYSignal.value = startYRef.current + moveY;
          }
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
          height: "400px",
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
        <fieldset>
          <legend>Zoom: {zoomSignal.value}</legend>
          <button onClick={zoomIn}>Zoom in</button>{" "}
          <button onClick={zoomOut}>Zoom out</button>
        </fieldset>
        <fieldset>
          <legend>
            Position: {canvasXSignal}:{canvasYSignal}
          </legend>
          <input
            type="number"
            value={canvasXSignal}
            onChange={(e) => {
              canvasXSignal.value = e.target.value;
            }}
          />
          <input
            type="number"
            value={canvasYSignal}
            onChange={(e) => {
              canvasYSignal.value = e.target.value;
            }}
          />
        </fieldset>
      </div>
    </div>
  );
};

render(<SpritesheetPicker />, document.querySelector("#root"));
