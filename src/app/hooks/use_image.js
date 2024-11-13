import { useLayoutEffect, useRef, useState } from "preact/hooks";

export const useImage = (url) => {
  const imageRef = useRef(null);
  const [imageLoaded, imageLoadedSetter] = useState(false);
  useLayoutEffect(() => {
    const image = new Image();
    const onload = () => {
      imageRef.current = image;
      imageLoadedSetter(true);
    };
    image.addEventListener("load", onload);
    image.src = url;
    return () => {
      imageRef.current = null;
      imageLoadedSetter(false);
      image.removeEventListener("load", onload);
    };
  }, [url]);

  return [imageRef.current, imageLoaded];
};
