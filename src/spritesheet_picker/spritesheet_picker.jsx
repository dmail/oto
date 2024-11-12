import { render } from "preact";
import { useRef, useLayoutEffect } from "preact/hooks";
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
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      imageUrlFacade.set(canvas.toDataURL());
    };
  });

  return (
    <div
      style={{
        width: "400px",
        height: "400px",
        border: "1px solid black",
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
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%" }}
      ></canvas>
    </div>
  );
};

render(<SpritesheetPicker />, document.querySelector("#root"));
