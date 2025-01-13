import { useLayoutEffect, useRef, useState } from "preact/hooks";

export const useImageLoader = (url) => {
  const imageRef = useRef(null);
  const [imageLoaded, imageLoadedSetter] = useState(false);
  const [loadError, loadErrorSetter] = useState(null);
  useLayoutEffect(() => {
    const image = new Image();
    const onload = () => {
      image.removeEventListener("error", onerror);
      image.removeEventListener("load", onload);
      imageRef.current = image;
      imageLoadedSetter(true);
    };
    const onerror = (errorEvent) => {
      image.removeEventListener("error", onerror);
      image.removeEventListener("load", onload);
      loadErrorSetter(errorEvent);
    };
    image.addEventListener("error", onerror);
    image.addEventListener("load", onload);
    image.src = url;
    return () => {
      image.removeEventListener("error", onerror);
      image.removeEventListener("load", onload);
    };
  }, [url]);

  return [imageRef.current, imageLoaded, loadError];
};
