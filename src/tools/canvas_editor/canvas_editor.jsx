import { batch, computed, effect, signal } from "@preact/signals";
import { render } from "preact";
import { memo } from "preact/compat";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "preact/hooks";
import { useDrawImage } from "../../app/hooks/use_draw_image.js";
import { useImage } from "../../app/hooks/use_image.js";
import { EyeClosedIconSvg } from "./eye_closed_icon.jsx";
import { EyeIconSvg } from "./eye_icon.jsx";
import { TrashIconSvg } from "./trash_icon.jsx";

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
const activeDrawingSignal = computed(() => {
  return drawingsSignal.value.find((drawing) => drawing.isActive);
});

const setActiveDrawing = (drawing) => {
  if (drawing.isActive) {
    return;
  }
  const currentActiveDrawing = activeDrawingSignal.value;
  if (currentActiveDrawing) {
    currentActiveDrawing.isActive = false;
  }
  drawing.isActive = true;
  drawingsSignal.value = [...drawingsSignal.value];
};
const getHighestZIndex = () => {
  const drawings = drawingsSignal.value;
  if (drawings.length === 0) {
    return 1;
  }
  let highestZIndex = drawings[0].zIndex;
  for (const drawing of drawings.slice(1)) {
    const zIndex = drawing.zIndex;
    if (zIndex > highestZIndex) {
      highestZIndex = zIndex;
    }
  }
  return highestZIndex;
};
const setDrawingProps = (drawing, props) => {
  let someDiff = false;
  for (const key of Object.keys(props)) {
    const value = props[key];
    if (drawing[key] !== value) {
      someDiff = true;
      drawing[key] = value;
    }
  }
  if (someDiff) {
    drawingsSignal.value = [...drawingsSignal.value];
  }
};
const setDrawingZIndex = (drawing, zIndex) => {
  setDrawingProps(drawing, { zIndex });
};
const setDrawingOpacity = (drawing, opacity) => {
  setDrawingProps(drawing, { opacity });
};
const setDrawingX = (drawing, x) => {
  setDrawingProps(drawing, { x });
};
const setDrawingY = (drawing, y) => {
  setDrawingProps(drawing, { y });
};
const setDrawingUrl = (drawing, url) => {
  setDrawingProps(drawing, { url });
};
const setDrawingVisibility = (drawing, isVisible) => {
  setDrawingProps(drawing, { isVisible });
};
const showDrawing = (drawing) => {
  setDrawingVisibility(drawing, true);
};
const hideDrawing = (drawing) => {
  setDrawingVisibility(drawing, false);
};
const moveToTheFront = (drawing) => {
  const highestZIndex = getHighestZIndex();
  if (drawing.zIndex !== highestZIndex) {
    setDrawingZIndex(drawing, highestZIndex + 1);
  }
};
const moveToTheBack = (drawing) => {
  const drawings = drawingsSignal.value;
  let lowestZIndex = drawings[0].zIndex;
  for (const drawing of drawings.slice(1)) {
    const zIndex = drawing.zIndex;
    if (zIndex < lowestZIndex) {
      lowestZIndex = zIndex;
    }
  }
  if (drawing.zIndex !== lowestZIndex) {
    setDrawingZIndex(drawing, lowestZIndex - 1);
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
const addDrawing = ({ type = "image", url, x = 0, y = 0 }) => {
  const drawing = {
    type,
    url,
    x,
    y,
    zIndex: getHighestZIndex(),
    isVisible: true,
    isActive: false,
    opacity: 1,
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

const CanvasEditor = () => {
  const [mousemoveOrigin, mousemoveOriginSetter] = useState();
  const [colorPickerEnabled, colorPickerEnabledSetter] = useState(false);
  const [selectionRectangleEnabled, selectionRectangleEnabledSetter] =
    useState(false);
  const [colorPicked, colorPickedSetter] = useState();
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
      const activeDrawing = activeDrawingSignal.value;
      if (activeDrawing && document.activeElement.tagName !== "INPUT") {
        const moveValue = keydownEvent.shiftKey ? 10 : 1;
        if (keydownEvent.key === "ArrowLeft") {
          keydownEvent.preventDefault();
          setDrawingX(activeDrawing, activeDrawing.x - moveValue);
        } else if (keydownEvent.key === "ArrowRight") {
          keydownEvent.preventDefault();
          setDrawingX(activeDrawing, activeDrawing.x + moveValue);
        } else if (keydownEvent.key === "ArrowUp") {
          keydownEvent.preventDefault();
          setDrawingY(activeDrawing, activeDrawing.y - moveValue);
        } else if (keydownEvent.key === "ArrowDown") {
          keydownEvent.preventDefault();
          setDrawingY(activeDrawing, activeDrawing.y + moveValue);
        } else if (keydownEvent.key === "Backspace") {
          removeDrawing(activeDrawing);
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

  const drawZoneRef = useRef();

  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <div
        name="draw"
        ref={drawZoneRef}
        style={{
          width: "700px",
          height: "400px",
          border: "1px solid black",
          position: "relative",
          cursor: grabKeyIsDown
            ? "grab"
            : colorPickerEnabled || selectionRectangleEnabled
              ? "crosshair"
              : "default",
          overflow: "hidden",
        }}
        onDragOver={(e) => {
          e.preventDefault();
          const [firstItem] = e.dataTransfer.items;
          if (!firstItem || firstItem.kind !== "file") {
            e.dataTransfer.dropEffect = "none";
            return;
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          const [firstItem] = e.dataTransfer.items;
          const file = firstItem.getAsFile();
          const objectUrl = URL.createObjectURL(file);
          addDrawing({
            url: objectUrl,
          });
        }}
        onMouseDown={(e) => {
          if (selectionRectangleEnabled) {
            return;
          }
          const elements = document.elementsFromPoint(e.clientX, e.clientY);
          const drawings = drawingsSignal.value;
          const drawing = drawings.find((drawing) => {
            return elements[0] === drawing.elementRef?.current;
          });
          if (drawing) {
            if (colorPickerEnabled) {
              const canvas = drawing.elementRef.current;
              const context = canvas.getContext("2d", {
                willReadFrequently: true,
              });
              const pixel = context.getImageData(
                e.offsetX,
                e.offsetY,
                1,
                1,
              ).data;
              colorPickedSetter(`${pixel[0]},${pixel[1]},${pixel[2]}`);
              return;
            }
            setActiveDrawing(drawing);
            startXRef.current = drawing.x;
            startYRef.current = drawing.y;
          }
          mousemoveOriginSetter({
            x: e.clientX,
            y: e.clientY,
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
          if (selectionRectangleEnabled) {
            return;
          }
          const originX = mousemoveOrigin.x;
          const originY = mousemoveOrigin.y;
          const mouseX = e.clientX;
          const mouseY = e.clientY;
          const moveX = mouseX - originX;
          const moveY = mouseY - originY;
          const activeDrawing = activeDrawingSignal.value;
          if (activeDrawing) {
            setDrawingProps(activeDrawing, {
              x: startXRef.current + moveX,
              y: startYRef.current + moveY,
            });
          }
        }}
      >
        {drawings.map((drawing, index) => {
          return <DrawingFacade key={index} {...drawing} drawing={drawing} />;
        })}
        <SelectionRectangle
          drawZoneRef={drawZoneRef}
          enabled={selectionRectangleEnabled}
        />
      </div>
      <div
        style={{
          width: "400px",
          border: "1px solid black",
          marginLeft: "10px",
          paddingLeft: "7px",
          paddingRight: "7px",
          paddingBottom: "7px",
        }}
      >
        <fieldset>
          <legend>
            Layers
            <button
              style={{ marginLeft: "3px" }}
              onClick={async () => {
                try {
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
                } catch (e) {
                  if (e.name === "AbortError") {
                    return;
                  }
                  throw e;
                }
              }}
            >
              Add
            </button>
          </legend>
          <div style="overflow:auto">
            {drawings
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((drawing, index) => {
                return <LayerListItem key={index} drawing={drawing} />;
              })}
          </div>
        </fieldset>
        <fieldset>
          <legend>Active layer</legend>
          {activeDrawingSignal.value ? (
            <ActiveLayerForm activeLayer={activeDrawingSignal.value} />
          ) : null}
        </fieldset>
        <fieldset>
          <legend>Tools</legend>
          <div>
            <button
              onClick={() => {
                if (colorPickerEnabled) {
                  colorPickerEnabledSetter(false);
                } else {
                  colorPickerEnabledSetter(true);
                  selectionRectangleEnabledSetter(false);
                }
              }}
              style={{
                backgroundColor: colorPickerEnabled ? "green" : "inherit",
              }}
            >
              Color picker
            </button>
            Color:{" "}
            <span
              style={{
                display: "inline-block",
                width: "1em",
                height: "1em",
                backgroundColor: `rgb(${colorPicked})`,
              }}
            ></span>
            <input type="text" readOnly value={colorPicked} />
          </div>
          <div>
            <button
              onClick={() => {
                if (selectionRectangleEnabled) {
                  selectionRectangleEnabledSetter(false);
                } else {
                  selectionRectangleEnabledSetter(true);
                  colorPickerEnabledSetter(false);
                }
              }}
              style={{
                backgroundColor: selectionRectangleEnabled
                  ? "green"
                  : "inherit",
              }}
            >
              Selection rectangle
            </button>
          </div>
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
        <button
          onClick={() => {
            batch(() => {
              zoomSignal.value = 1;
              drawingsSignal.value = [];
            });
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

const SelectionRectangle = ({ drawZoneRef, enabled }) => {
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

const DrawingFacade = memo(({ type, ...props }) => {
  if (!props.drawing.isVisible) {
    return null;
  }
  if (type === "image") {
    return <ImageLayerFacade {...props} />;
  }
  if (type === "grid") {
    return <Grid {...props} />;
  }
  return <Drawing {...props} />;
});

const ActiveLayerForm = ({ activeLayer }) => {
  return (
    <div>
      <label>
        type
        <input type="text" value={activeLayer.type} readOnly />
      </label>
      <br />
      <label>
        x
        <input
          type="number"
          value={activeLayer.x}
          style={{ width: "4em" }}
          onInput={(e) => {
            setDrawingX(activeLayer, e.target.valueAsNumber);
          }}
        ></input>
      </label>
      <label
        style={{
          marginLeft: "1em",
        }}
      >
        y
        <input
          type="number"
          value={activeLayer.y}
          style={{ width: "4em" }}
          onInput={(e) => {
            setDrawingY(activeLayer, e.target.valueAsNumber);
          }}
        ></input>
      </label>
      <br />
      <label>
        width
        <input
          type="number"
          value={activeLayer.width}
          style={{ width: "4em" }}
          readOnly
        ></input>
      </label>
      <label>
        height
        <input
          type="number"
          value={activeLayer.height}
          style={{ width: "4em" }}
          readOnly
        ></input>
      </label>
      <br />
      <label>
        zIndex
        <input
          type="number"
          value={activeLayer.zIndex}
          style={{ width: "4em" }}
          onInput={(e) => {
            setDrawingZIndex(activeLayer, e.target.valueAsNumber);
          }}
        ></input>
      </label>
      <button
        onClick={() => {
          moveToTheFront(activeLayer);
        }}
      >
        Move front
      </button>
      <button
        onClick={() => {
          moveToTheBack(activeLayer);
        }}
      >
        Move back
      </button>
      <br />
      <label>
        Transparence
        <input
          type="number"
          value={activeLayer.opacity}
          min={0.1}
          max={1}
          step={0.1}
          style={{ width: "4em" }}
          onInput={(e) => {
            setDrawingOpacity(activeLayer, e.target.valueAsNumber);
          }}
        ></input>
      </label>
      <br />
      <fieldset>
        <legend>{activeLayer.type} props</legend>
        {activeLayer.type === "image" ? (
          <ImageLayerForm activeLayer={activeLayer} />
        ) : activeLayer.type === "grid" ? (
          <GridLayerForm activeLayer={activeLayer} />
        ) : null}
      </fieldset>
    </div>
  );
};

const ImageLayerForm = ({ activeLayer }) => {
  return (
    <label>
      Url
      <input type="text" value={activeLayer.url} />
      <button
        onClick={async () => {
          try {
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
            setDrawingUrl(activeLayer, URL.createObjectURL(fileData));
          } catch (e) {
            if (e.name === "AbortError") {
              return;
            }
            throw e;
          }
        }}
      >
        Select
      </button>
    </label>
  );
};

const GridLayerForm = ({ activeLayer }) => {
  return (
    <>
      <label>
        Cell width
        <input
          type="number"
          value={activeLayer.cellWidth}
          onInput={(e) => {
            setDrawingProps(activeLayer, {
              cellWidth: e.target.valueAsNumber,
            });
          }}
        ></input>
      </label>
      <label>
        Cell height
        <input
          type="number"
          value={activeLayer.cellHeight}
          onInput={(e) => {
            setDrawingProps(activeLayer, {
              cellHeight: e.target.valueAsNumber,
            });
          }}
        ></input>
      </label>
    </>
  );
};

const ImageLayerFacade = ({ url, ...props }) => {
  const [image] = useImage(url);
  if (!image) return null;
  return <Drawing image={image} url={url} {...props} />;
};

const Drawing = ({ image, url, x, y, isActive, zIndex, drawing }) => {
  const canvasRef = useRef();
  const zoom = zoomSignal.value;
  const width = image ? image.naturalWidth * zoom : 0;
  const height = image ? image.naturalHeight * zoom : 0;
  const opacity = drawing.opacity;
  drawing.elementRef = canvasRef;
  useDrawImage(canvasRef, image, {
    debug: true,
    x: 0,
    y: 0,
    width,
    height,
    opacity,
    onDraw: useCallback(() => {
      if (url.startsWith("data")) {
        return;
      }
      drawing.width = width;
      drawing.height = height;
      drawing.url = canvasRef.current.toDataURL();
      drawingsSignal.value = [...drawingsSignal.value];
    }, [width, height, opacity]),
  });

  return (
    <canvas
      ref={canvasRef}
      tabIndex={-1}
      onFocus={() => {
        setActiveDrawing(drawing);
      }}
      style={{
        outline: isActive ? "2px dotted black" : "",
        position: "absolute",
        zIndex,
        left: `${x}px`,
        top: `${y}px`,
      }}
      width={width}
      height={height}
    ></canvas>
  );
};

const Grid = ({ opacity, x, y, cellWidth, cellHeight }) => {
  const canvasRef = useRef();
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.globalAlpha = opacity;
    const drawCell = (cellX, cellY, color) => {
      context.beginPath();
      // context.globalAlpha = 0.8;
      // context.lineWidth = 1;
      context.rect(cellX + x, cellY + y, cellWidth, cellHeight);
      context.fillStyle = color;
      context.fill();
      context.closePath();
    };
    const xCellLastIndex = Math.ceil(canvas.width / cellWidth);
    const yCellLastIndex = Math.ceil(canvas.height / cellHeight);
    let xCellIndex = 0;
    let yCellIndex = 0;
    while (yCellIndex < yCellLastIndex) {
      while (xCellIndex < xCellLastIndex) {
        drawCell(
          xCellIndex * cellWidth,
          yCellIndex * cellHeight,
          xCellIndex % 2 === yCellIndex % 2 ? "black" : "violet",
        );
        xCellIndex++;
      }
      xCellIndex = 0;
      yCellIndex++;
    }
    context.restore();
  }, [opacity, x, y, cellWidth, cellHeight]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        pointerEvents: "none",
        position: "absolute",
        left: "0",
        width: "100%",
        height: "100%",
      }}
    ></canvas>
  );
};

const LayerListItem = ({ drawing }) => {
  const isVisible = drawing.isVisible;
  const canvasRef = useRef();

  const [image] = useImage(drawing.url);
  useDrawImage(canvasRef, image);

  return (
    <div
      style={{
        width: "100%",
        height: "35px",
        border: "1px solid black",
        display: "flex",
        alignItems: "center",
      }}
    >
      <button
        style={{
          width: "38px",
          height: "100%",
        }}
        onClick={() => {
          if (isVisible) {
            hideDrawing(drawing);
          } else {
            showDrawing(drawing);
          }
        }}
      >
        <div style={{ display: "flex", flexDirection: "row" }}>
          {isVisible ? <EyeIconSvg /> : <EyeClosedIconSvg />}
        </div>
      </button>
      <div
        style={{
          width: "100%",
          height: "100%",
          background: drawing.isActive ? "lightblue" : "inherit",
          display: "flex",
          alignItems: "center",
        }}
        onClick={() => {
          setActiveDrawing(drawing);
        }}
      >
        <div
          style={{
            width: "40px",
            height: "100%",
            paddingTop: "2px",
            paddingBottom: "2px",
            marginLeft: "5px",
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: "100%",
              height: "100%",
              border: "1px solid black",
            }}
          ></canvas>
        </div>
        <div
          style={{
            flex: 1,
          }}
        ></div>
        <button
          style={{
            width: "24px",
            height: "100%",
            border: "none",
            padding: 0,
            paddingLeft: "2px",
            paddingRight: "2px",
            background: "none",
          }}
          onClick={() => {
            removeDrawing(drawing);
          }}
        >
          <TrashIconSvg />
        </button>
      </div>
    </div>
  );
};

render(<CanvasEditor />, document.querySelector("#root"));
