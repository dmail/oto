import { fromTransformations } from "matrix";

class MqlSprite extends HTMLElement {
  static tagName = "mql-sprite";
  static observedAttributes = [
    "url",
    "x",
    "y",
    "width",
    "height",
    "transparentColor",
    "mirrorX",
    "mirrorY",
  ];

  connectedCallback() {
    const shadow = this.attachShadow({ mode: "open" });
    const canvas = document.createElement("canvas");
    canvas.width = "100%";
    canvas.height = "100%";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    shadow.appendChild(canvas);
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    this.update();
  }

  attributeChangedCallback() {
    if (this.shadowRoot) {
      this.update();
    }
  }

  // eslint-disable-next-line accessor-pairs
  set transparentColor(value) {
    this.transparentColors = value;
  }

  update() {
    const url = this.getAttribute("url");
    const x = this.getAttribute("x");
    const y = this.getAttribute("y");
    const width = this.getAttribute("width");
    const height = this.getAttribute("height");
    const transparentColor = this.transparentColors;
    const mirrorX = this.getAttribute("mirror-x");
    const mirrorY = this.getAttribute("mirror-y");
    const canvas = this.shadowRoot.querySelector("canvas");
    const image = new Image();
    const context = canvas.getContext("2d");
    image.onload = () => {
      let source = image;
      if (transparentColor) {
        source = replaceColorWithTransparentPixels(image, transparentColor);
      }
      const transformations = {
        ...(mirrorX || mirrorY
          ? {
              flip: {
                x: mirrorX,
                y: mirrorY,
              },
              translate: {
                x: mirrorX ? -parseInt(width) : 0,
                y: mirrorY ? -parseInt(height) : 0,
              },
            }
          : {}),
      };
      const hasTransformations = Object.keys(transformations).length > 0;
      context.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      if (hasTransformations) {
        context.save();
        const matrix = fromTransformations(transformations);
        context.setTransform(...matrix);
        //  context.setTransform(-1, 0, 0, 1, parseInt(width), 0);
      }
      context.drawImage(
        source,
        parseInt(x),
        parseInt(y),
        parseInt(width),
        parseInt(height),
        0,
        0,
        canvas.offsetWidth,
        canvas.offsetHeight,
      );
      if (hasTransformations) {
        context.restore();
      }
    };
    image.src = url;
  }
}
customElements.define(MqlSprite.tagName, MqlSprite);

const replaceColorWithTransparentPixels = (image, color) => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, image.width, image.height);
  const pixels = imageData.data;

  let shouldReplace;
  const [first] = color;
  if (typeof first === "object") {
    shouldReplace = (r, g, b) => {
      return color.some((c) => {
        return r === c[0] && g === c[1] && b === c[2];
      });
    };
  } else {
    const rToReplace = parseInt(color[0]);
    const gToReplace = parseInt(color[1]);
    const bToReplace = parseInt(color[2]);
    shouldReplace = (r, g, b) => {
      return r === rToReplace && g === gToReplace && b === bToReplace;
    };
  }

  for (let i = 0, n = pixels.length; i < n; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    if (shouldReplace(r, g, b)) {
      pixels[i + 3] = 0;
    }
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
};

export const SpriteSheet = ({ transparentColor, ...props }) => {
  return <mql-sprite transparentColor={transparentColor} {...props} />;
};
