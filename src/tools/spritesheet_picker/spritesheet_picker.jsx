import { computed, effect, signal, useSignalEffect } from "@preact/signals";
import { render } from "preact";
import { memo } from "preact/compat";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { useDrawImage } from "../../app/hooks/use_draw_image.js";
import { useImage } from "../../app/hooks/use_image.js";
// import { useLocalStorageState } from "../../app/hooks/use_local_storage_state.js";

// if (import.meta.hot) {
//   import.meta.hot.decline();
// }

const createFile = async (filename) => {
  // https://stackoverflow.com/questions/44094507/how-to-store-large-files-to-web-local-storage
  let storageRoot = null;
  try {
    storageRoot = await window.navigator.storage.getDirectory();
  } catch (e) {
    throw e;
  }

  return {
    readAsText: async () => {
      let fileHandle;
      try {
        fileHandle = await storageRoot.getFileHandle(filename);
      } catch (e) {
        if (e.name === "NotFoundError") {
          return undefined;
        }
        throw e;
      }
      const file = await fileHandle.getFile();
      return readFileAsText(file);
    },
    write: async (content) => {
      const fileHandle = await storageRoot.getFileHandle(filename, {
        create: true,
      });
      const writableStream = await fileHandle.createWritable();
      await writableStream.write(content);
      await writableStream.close();
    },
  };
};
const readFileAsText = async (file) => {
  const reader = new FileReader();
  let _resolve;
  reader.addEventListener(
    "load",
    () => {
      _resolve(reader.result);
    },
    false,
  );
  const fileContentPromise = new Promise((resolve) => {
    _resolve = resolve;
  });
  reader.readAsText(file);
  return fileContentPromise;
};
const anonymousProjectFile = await createFile("anonymous.json");
const drawingsSignal = signal([]);
const zoomSignal = signal(1);
const selectedDrawingSignal = computed(() => {
  return drawingsSignal.value.find((drawing) => drawing.isSelected);
});
const moveSelectedDrawingAbsolute = (x = 0, y = 0) => {
  const selectedDrawing = selectedDrawingSignal.value;
  if (selectedDrawing) {
    if (x !== undefined) {
      selectedDrawing.x = x;
    }
    if (y !== undefined) {
      selectedDrawing.y = y;
    }
    drawingsSignal.value = [...drawingsSignal.value];
  }
};
const moveSelectedDrawingRelative = (x = 0, y = 0) => {
  const selectedDrawing = selectedDrawingSignal.value;
  if (selectedDrawing) {
    moveSelectedDrawingAbsolute(selectedDrawing.x + x, selectedDrawing.y + y);
  }
};
const availableZooms = [0.1, 0.5, 1, 1.5, 2, 4];

const anonymousProjectFileContent = await anonymousProjectFile.readAsText();
if (anonymousProjectFileContent) {
  const { drawings, zoom } = JSON.parse(anonymousProjectFileContent);
  if (Array.isArray(drawings)) {
    drawingsSignal.value = drawings;
  }
  if (typeof zoom === "number") {
    zoomSignal.value = zoom;
  }
}
effect(() => {
  const drawings = drawingsSignal.value;
  const zoom = zoomSignal.value;
  anonymousProjectFile.write(
    JSON.stringify({
      drawings,
      zoom,
    }),
  );
});
const addDrawing = ({ url, x = 0, y = 0 }) => {
  const drawing = {
    url,
    x,
    y,
  };
  const drawings = drawingsSignal.value;
  drawingsSignal.value = [...drawings, drawing];
};
const removeDrawing = (drawing) => {
  const drawings = drawingsSignal.value;
  const index = drawings.indexOf(drawing);
  drawings.splice(index, 1);
  drawingsSignal.value = [...drawings];
};

const selectionRectangleFacade = {
  borderColor: "orange",
  signal: signal(),
};

const SpritesheetPicker = () => {
  const [mousemoveOrigin, mousemoveOriginSetter] = useState();
  const [colorAt, colorAtSetter] = useState(); // TODO: replace with a color picker
  const [grabKeyIsDown, grabKeyIsDownSetter] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const drawings = drawingsSignal.value;

  useEffect(() => {
    let removekeyup = () => {};
    const onkeydown = (keydownEvent) => {
      if (keydownEvent.metaKey) {
        grabKeyIsDownSetter(true);
      }
      const selectedDrawing = selectedDrawingSignal.value;
      if (selectedDrawing && document.activeElement.tagName !== "INPUT") {
        if (keydownEvent.key === "ArrowLeft") {
          keydownEvent.preventDefault();
          moveSelectedDrawingRelative(-1);
        } else if (keydownEvent.key === "ArrowRight") {
          keydownEvent.preventDefault();
          moveSelectedDrawingRelative(1);
        } else if (keydownEvent.key === "ArrowUp") {
          keydownEvent.preventDefault();
          moveSelectedDrawingRelative(0, -1);
        } else if (keydownEvent.key === "ArrowDown") {
          keydownEvent.preventDefault();
          moveSelectedDrawingRelative(0, +1);
        } else if (keydownEvent.key === "Backspace") {
          removeDrawing(selectedDrawing);
        }
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
          overflow: "hidden",
        }}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.items[0].getAsFile();
          const objectUrl = URL.createObjectURL(file);
          addDrawing({
            url: objectUrl,
          });
        }}
        onMouseDown={(e) => {
          const elements = document.elementsFromPoint(e.clientX, e.clientY);
          const drawings = drawingsSignal.value;
          const drawing = drawings.find((drawing) => {
            return elements[0] === drawing.elementRef?.current;
          });
          if (drawing) {
            const selectedDrawing = selectedDrawingSignal.value;
            if (selectedDrawing) {
              selectedDrawing.isSelected = false;
            }
            drawing.isSelected = true;
            drawingsSignal.value = [...drawings];
            startXRef.current = drawing.x;
            startYRef.current = drawing.y;
          }
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
          const moveX = mouseX - originX;
          const moveY = mouseY - originY;
          const selectedDrawing = selectedDrawingSignal.value;
          if (selectedDrawing) {
            moveSelectedDrawingAbsolute(
              startXRef.current + moveX,
              startYRef.current + moveY,
            );
            drawingsSignal.value = [...drawings];
          }
        }}
        // onMouseDown={(e) => {
        //   const canvas = canvasRef.current;
        //   const context = canvas.getContext("2d", { willReadFrequently: true });
        //   const pixel = context.getImageData(e.offsetX, e.offsetY, 1, 1).data;
        //   colorAtSetter(`${pixel[0]},${pixel[1]},${pixel[2]}`);

        //   startXRef.current = canvasXSignal.value;
        //   startYRef.current = canvasYSignal.value;
        // }}
      >
        {drawings.map((drawing, index) => {
          return <DrawingFacade key={index} {...drawing} drawing={drawing} />;
        })}
        <SelectionRectangle />
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
            disabled={!selectedDrawingSignal.value}
            value={selectedDrawingSignal.value?.x}
            onInput={(e) => {
              moveSelectedDrawingAbsolute(e.target.valueAsNumber);
            }}
          ></input>
          <br />
          Y:
          <input
            type="number"
            disabled={!selectedDrawingSignal.value}
            value={selectedDrawingSignal.value?.y}
            onInput={(e) => {
              moveSelectedDrawingAbsolute(0, e.target.valueAsNumber);
            }}
          ></input>
          <br />
          width:
          <input
            type="number"
            value={selectedDrawingSignal.value?.width}
            readOnly
          ></input>
          <br />
          height:
          <input
            type="number"
            value={selectedDrawingSignal.value?.height}
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
          {availableZooms.map((availableZoom) => {
            return (
              <button
                key={availableZoom}
                onClick={() => {
                  zoomSignal.value = availableZoom;
                }}
              >
                {availableZoom}
              </button>
            );
          })}
        </fieldset>
      </div>
      <div>
        <button
          onClick={async () => {
            const [fileHandle] = await window.showOpenFilePicker({
              types: [
                {
                  description: "Images",
                  accept: {
                    "image/*": [".png", ".gif", ".jpeg", ".jpg"],
                  },
                },
              ],
              excludeAcceptAllOption: true,
              multiple: false,
            });
            const fileData = await fileHandle.getFile();
            addDrawing({
              url: URL.createObjectURL(fileData),
            });
          }}
        >
          Add file
        </button>
      </div>
    </div>
  );
};

const SelectionRectangle = () => {
  const selectionRectangleCanvasRef = useRef();
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

  return (
    <canvas
      ref={selectionRectangleCanvasRef}
      style={{
        position: "absolute",
        left: "0",
        width: "100%",
        height: "100%",
      }}
    ></canvas>
  );
};

const DrawingFacade = memo(({ url, ...props }) => {
  const [image] = useImage(url);
  if (!image) return null;
  return <Drawing image={image} url={url} {...props} />;
});

const Drawing = ({ image, url, x, y, isSelected, drawing }) => {
  const canvasRef = useRef();
  const zoom = zoomSignal.value;
  const width = image.naturalWidth * zoom;
  const height = image.naturalHeight * zoom;
  drawing.elementRef = canvasRef;
  useDrawImage(canvasRef, image, {
    debug: true,
    x: 0,
    y: 0,
    width,
    height,
    onDraw: useCallback(() => {
      if (url.startsWith("data")) {
        return;
      }
      drawing.width = width;
      drawing.height = height;
      drawing.url = canvasRef.current.toDataURL();
      drawingsSignal.value = [...drawingsSignal.value];
    }, [width, height]),
  });

  return (
    <canvas
      ref={canvasRef}
      style={{
        border: isSelected ? "2px dotted black" : "",
        position: "absolute",
        zIndex: 1,
        left: `${x}px`,
        top: `${y}px`,
      }}
      width={width}
      height={height}
    ></canvas>
  );
};

render(<SpritesheetPicker />, document.querySelector("#root"));
