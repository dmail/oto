import { batch, computed, effect, signal } from "@preact/signals";
import { render } from "preact";
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
import { MagicWandSelectionIconSvg } from "./magic_wand_selection_icon.jsx";
import { RectangleSelectionIconSvg } from "./rectangle_selection_icon.jsx";
import { SelectionRectangle } from "./selection_rectangle.jsx";
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
  const keysModified = [];
  for (const key of Object.keys(props)) {
    const value = props[key];
    if (drawing[key] !== value) {
      keysModified.push(key);
      drawing[key] = value;
    }
  }

  if (keysModified.length) {
    if (keysModified.includes("zIndex")) {
      drawingsSignal.value.sort((a, b) => a.zIndex - b.zIndex);
    } else {
      drawingsSignal.value = [...drawingsSignal.value];
    }
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
let drawingId = 1;
const addDrawing = ({ type = "image", url, x = 0, y = 0, ...props }) => {
  const drawing = {
    id: drawingId++,
    type,
    url,
    x,
    y,
    zIndex: getHighestZIndex(),
    isVisible: true,
    isActive: false,
    opacity: 1,
    ...props,
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
  const drawings = drawingsSignal.value;
  const [colorPickerEnabled, colorPickerEnabledSetter] = useState(false);
  const [colorPicked, colorPickedSetter] = useState();

  const [activeSelectionTool, setActiveSelectionTool] = useState("none");
  const rectangleSelectionToolIsActive =
    activeSelectionTool === "selection_rectangle";
  const magicWandSelectionToolIsActive = activeSelectionTool === "magic_wand";
  const activateRectangleSelectionTool = () => {
    setActiveSelectionTool("selection_rectangle");
  };
  const deactivateRectangleSelectionTool = () => {
    setActiveSelectionTool("none");
  };
  const activateMagicWandSelectionTool = () => {
    setActiveSelectionTool("magic_wand");
  };
  const deactivateMagicWandSelectionTool = () => {
    setActiveSelectionTool("none");
  };

  const [mousemoveOrigin, mousemoveOriginSetter] = useState();
  const [grabKeyIsDown, grabKeyIsDownSetter] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);

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
          overflow: "scroll",
          cursor: grabKeyIsDown
            ? "grab"
            : colorPickerEnabled || rectangleSelectionToolIsActive
              ? "crosshair"
              : "default",
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
          if (activeSelectionTool !== "none") {
            return;
          }
          const elements = document.elementsFromPoint(e.clientX, e.clientY);
          const drawing = drawings
            .slice()
            .reverse()
            .find((drawing) => {
              return elements.find(
                (element) => element === drawing.elementRef?.current,
              );
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
          if (activeSelectionTool !== "none") {
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
        {drawings.map((drawing) => {
          return <DrawingFacade key={drawing.id} drawing={drawing} />;
        })}
        <SelectionRectangle
          drawZoneRef={drawZoneRef}
          enabled={rectangleSelectionToolIsActive}
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
        <Toolbar
          drawings={drawings}
          rectangleSelectionToolIsActive={rectangleSelectionToolIsActive}
          magicWandSelectionToolIsActive={magicWandSelectionToolIsActive}
          activateMagicWandSelectionTool={activateMagicWandSelectionTool}
          deactivateMagicWandSelectionTool={deactivateMagicWandSelectionTool}
          activateRectangleSelectionTool={activateRectangleSelectionTool}
          deactivateRectangleSelectionTool={deactivateRectangleSelectionTool}
          colorPicked={colorPicked}
          colorPickerEnabled={colorPickerEnabled}
          colorPickerEnabledSetter={colorPickerEnabledSetter}
        />
      </div>
    </div>
  );
};

const DrawingFacade = ({ drawing }) => {
  const { isVisible } = drawing;
  if (!isVisible) {
    return null;
  }

  const { type } = drawing;
  if (type === "image") {
    const { url, opacity } = drawing;
    return (
      <DrawingContainer drawing={drawing}>
        <ImageDrawing
          url={url}
          opacity={opacity}
          onDraw={({ width, height, canvas }) => {
            setDrawingProps(drawing, {
              ...(url.startsWith("data")
                ? null
                : {
                    width,
                    height,
                    url: canvas.toDataURL(),
                  }),
            });
          }}
        />
      </DrawingContainer>
    );
  }
  if (type === "grid") {
    const { cellWidth, cellHeight, opacity, width, height } = drawing;
    return (
      <DrawingContainer drawing={drawing}>
        <GridDrawing
          width={width}
          height={height}
          opacity={opacity}
          cellWidth={cellWidth}
          cellHeight={cellHeight}
          onDraw={() => {
            setDrawingProps(drawing, {});
          }}
        />
      </DrawingContainer>
    );
  }
  return <DrawingContainer drawing={drawing} />;
};

const DrawingContainer = ({ drawing, children }) => {
  const { isActive, x, y, zIndex } = drawing;
  const elementRef = useRef();
  drawing.elementRef = elementRef;

  return (
    <div
      ref={elementRef}
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
    >
      {children}
    </div>
  );
};

const GridDrawing = ({
  width,
  height,
  opacity,
  cellWidth,
  cellHeight,
  onDraw,
}) => {
  const canvasRef = useRef();

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.globalAlpha = opacity;
    const drawCell = (cellX, cellY, color) => {
      context.beginPath();
      context.rect(cellX, cellY, cellWidth, cellHeight);
      context.fillStyle = color;
      context.fill();
      context.closePath();
    };
    const width = canvas.width;
    const height = canvas.height;
    const xCellLastIndex = Math.ceil(width / cellWidth);
    const yCellLastIndex = Math.ceil(height / cellHeight);
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
    if (onDraw) {
      onDraw();
    }
  }, [opacity, width, height, cellWidth, cellHeight, onDraw]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: "block", // ensure parent div size is correct
      }}
      width={width}
      height={height}
    ></canvas>
  );
};
const ImageDrawing = ({ url, width, height, opacity, onDraw }) => {
  const canvasRef = useRef();
  const [image] = useImage(url);
  const zoom = zoomSignal.value;
  const sourceWidth = image ? image.naturalWidth * zoom : 0;
  const sourceHeight = image ? image.naturalHeight * zoom : 0;
  useDrawImage(canvasRef.current, image, {
    debug: true,
    x: 0,
    y: 0,
    width: sourceWidth,
    height: sourceHeight,
    opacity,
    onDraw: useCallback(() => {
      onDraw({
        width: image.naturalWidth,
        height: image.naturalHeight,
        canvas: canvasRef.current,
      });
    }, [image, width, height]),
  });
  return (
    <canvas
      ref={canvasRef}
      style={{
        display: "block", // ensure parent div size is correct
      }}
      width={width}
      height={height}
    ></canvas>
  );
};

const Toolbar = ({
  drawings,
  rectangleSelectionToolIsActive,
  magicWandSelectionToolIsActive,
  activateRectangleSelectionTool,
  deactivateRectangleSelectionTool,
  activateMagicWandSelectionTool,
  deactivateMagicWandSelectionTool,
  colorPicked,
  colorPickerEnabled,
  colorPickerEnabledSetter,
}) => {
  return (
    <>
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
          <button
            style={{ marginLeft: "3px" }}
            onClick={() => {
              addDrawing({
                type: "grid",
                width: 100,
                height: 100,
                cellWidth: 32,
                cellHeight: 32,
              });
            }}
          >
            Add grid
          </button>
        </legend>
        <div style="overflow:auto">
          {drawings.map((drawing) => {
            return <LayerListItem key={drawing.id} drawing={drawing} />;
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

        <button
          onClick={() => {
            if (rectangleSelectionToolIsActive) {
              deactivateRectangleSelectionTool();
            } else {
              activateRectangleSelectionTool();
            }
          }}
          style={{
            padding: "0",
            width: "24px",
            height: "24px",
            border: "none",
            backgroundColor: rectangleSelectionToolIsActive
              ? "green"
              : "inherit",
          }}
        >
          <RectangleSelectionIconSvg />
        </button>

        <button
          onClick={() => {
            if (magicWandSelectionToolIsActive) {
              deactivateMagicWandSelectionTool();
            } else {
              activateMagicWandSelectionTool();
            }
          }}
          style={{
            padding: "0",
            width: "24px",
            height: "24px",
            border: "none",
            backgroundColor: magicWandSelectionToolIsActive
              ? "green"
              : "inherit",
          }}
        >
          <MagicWandSelectionIconSvg />
        </button>

        <div>
          <button
            onClick={() => {
              if (colorPickerEnabled) {
                colorPickerEnabledSetter(false);
              } else {
                colorPickerEnabledSetter(true);
              }
            }}
            style={{
              backgroundColor: colorPickerEnabled ? "green" : "inherit",
            }}
          >
            Color picker
          </button>
          Color:
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
    </>
  );
};
const LayerListItem = ({ drawing }) => {
  const isVisible = drawing.isVisible;
  const canvasRef = useRef();
  useDrawImage(canvasRef.current, () => {
    const drawingElement = drawing.elementRef.current;
    return drawingElement?.querySelector("canvas");
  });

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
          onInput={(e) => {
            setDrawingProps(activeLayer, { width: e.target.valueAsNumber });
          }}
        ></input>
      </label>
      <label>
        height
        <input
          type="number"
          value={activeLayer.height}
          style={{ width: "4em" }}
          onInput={(e) => {
            setDrawingProps(activeLayer, { height: e.target.valueAsNumber });
          }}
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
      <br />
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

render(<CanvasEditor />, document.querySelector("#root"));
