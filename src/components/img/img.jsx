/*
 * TODO:
 *  - when there is an error while loading image draw a message on the canvas
 */

import { useDrawImage } from "hooks/use_draw_image.js";
import { useImageLoader } from "hooks/use_image_loader.js";
import { fromTransformations } from "matrix";
import { forwardRef } from "preact/compat";
import { useImperativeHandle, useMemo, useRef } from "preact/hooks";

export const Img = forwardRef(
  (
    {
      source,
      width,
      height,
      sourceX,
      sourceY,
      sourceWidth,
      souceHeight,
      mirrorX,
      mirrorY,
      transparentColor,
      ...props
    },
    ref,
  ) => {
    const innerRef = useRef();
    useImperativeHandle(ref, () => innerRef.current);

    const image = useImage(source, {
      width,
      height,
      sourceX,
      sourceY,
      sourceWidth,
      souceHeight,
      mirrorX,
      mirrorY,
      transparentColor,
    });
    useDrawImage(innerRef.current, image);

    return (
      <canvas
        {...props}
        ref={innerRef}
        width={width}
        height={height}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    );
  },
);

export const useImage = (
  source,
  {
    name,
    width,
    height,
    sourceX,
    sourceY,
    sourceWidth = width,
    sourceHeight = height,
    mirrorX,
    mirrorY,
    transparentColor,
  } = {},
) => {
  const [image] = useImageLoader(source);
  if (width === undefined) {
    width = image ? image.naturalWidth : undefined;
  } else {
    width = parseInt(width);
  }
  if (height === undefined) {
    height = image ? image.naturalHeight : undefined;
  } else {
    height = parseInt(height);
  }
  if (sourceX === undefined) {
    sourceX = 0;
  } else {
    sourceX = parseInt(sourceX);
  }
  if (sourceY === undefined) {
    sourceY = 0;
  } else {
    sourceY = parseInt(sourceY);
  }
  if (transparentColor) {
    if (typeof transparentColor[0] === "number") {
      transparentColor = [transparentColor];
    }
  } else {
    transparentColor = [];
  }
  const shouldReplace = useMemo(
    () => createShouldReplace(transparentColor),
    transparentColor.map((color) => `${color[0]}${color[1]}${color[2]}`),
  );
  const imageTransformed = useMemo(() => {
    if (!image) {
      return null;
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
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
    context.clearRect(0, 0, width, height);
    if (hasTransformations) {
      context.save();
      const matrix = fromTransformations(transformations);
      context.setTransform(...matrix);
      // context.setTransform(-1, 0, 0, 1, parseInt(width), 0);
    }
    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      width,
      height,
    );
    if (hasTransformations) {
      context.restore();
    }
    if (shouldReplace) {
      const imageData = context.getImageData(0, 0, width, height);
      const pixels = imageData.data;

      for (let i = 0, n = pixels.length; i < n; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        if (shouldReplace(r, g, b)) {
          pixels[i + 3] = 0;
        }
      }
      context.putImageData(imageData, 0, 0);
    }
    return canvas;
  }, [
    name,
    image,
    width,
    height,
    mirrorX,
    mirrorY,
    shouldReplace,
    sourceX,
    sourceY,
  ]);

  return imageTransformed;
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
