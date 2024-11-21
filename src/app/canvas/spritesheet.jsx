import { fromTransformations } from "matrix";
import { useLayoutEffect, useMemo, useRef } from "preact/hooks";
import { useImage } from "../hooks/use_image.js";

export const SpriteSheet = ({
  name,
  className = "sprite",
  url,
  transparentColor,
  x,
  y,
  width,
  height,
  mirrorX,
  mirrorY,
  elementRef = useRef(),
  ...props
}) => {
  x = parseInt(x);
  y = parseInt(y);
  width = parseInt(width);
  height = parseInt(height);
  if (transparentColor) {
    if (typeof transparentColor[0] === "number") {
      transparentColor = [transparentColor];
    }
  } else {
    transparentColor = [];
  }

  const [image] = useImage(url);
  const shouldReplace = useMemo(
    () => createShouldReplace(transparentColor),
    transparentColor.map((color) => `${color[0]}${color[1]}${color[2]}`),
  );
  useLayoutEffect(() => {
    if (!image) {
      return;
    }
    let source = image;
    if (shouldReplace) {
      source = replaceColorWithTransparentPixels(image, shouldReplace);
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
    const canvas = elementRef.current;
    const hasTransformations = Object.keys(transformations).length > 0;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (hasTransformations) {
      context.save();
      const matrix = fromTransformations(transformations);
      context.setTransform(...matrix);
      // context.setTransform(-1, 0, 0, 1, parseInt(width), 0);
    }
    context.drawImage(
      source,
      x,
      y,
      width,
      height,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    if (hasTransformations) {
      context.restore();
    }
  }, [image, shouldReplace, x, y, width, height]);

  return (
    <canvas
      {...props}
      ref={elementRef}
      width={width}
      height={height}
      name={name}
      className={className}
      style={{
        width: "100%",
        height: "100%",
      }}
    />
  );
};

const createShouldReplace = (colorsToReplace) => {
  if (colorsToReplace.length === 0) {
    return null;
  }
  if (colorsToReplace.length === 1) {
    const colorToReplace = colorsToReplace[0];
    const rToReplace = parseInt(colorToReplace[0]);
    const gToReplace = parseInt(colorToReplace[1]);
    const bToReplace = parseInt(colorToReplace[2]);
    return (r, g, b) => {
      return r === rToReplace && g === gToReplace && b === bToReplace;
    };
  }
  return (r, g, b) => {
    return colorsToReplace.some((c) => {
      return r === c[0] && g === c[1] && b === c[2];
    });
  };
};

const replaceColorWithTransparentPixels = (image, shouldReplace) => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, image.width, image.height);
  const pixels = imageData.data;

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

// const mapPixels = (imageData, callback) => {
//   let modified = false;
//   const pixels = imageData.data;
//   for (let i = 0, n = pixels.length; i < n; i += 4) {
//     const r = pixels[i];
//     const g = pixels[i + 1];
//     const b = pixels[i + 2];
//     const result = callback(r, g, b);
//     if (!result) {
//       continue;
//     }
//     const [r2, g2, b2] = result;
//     if (r2 !== r) {
//       modified = true;
//       pixels[i] = r2;
//     }
//     if (g2 !== g) {
//       modified = true;
//       pixels[i + 1] = g2;
//     }
//     if (b2 !== b) {
//       modified = true;
//       pixels[i + 2] = b2;
//     }
//   }
//   if (modified) {
//     context.putImageData(imageData, 0, 0);
//   }
// };
