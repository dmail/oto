import { useEffect, useState } from "preact/hooks";

export const useRenderOnHotReload = () => {
  const [hotreload, hotreloadSetter] = useState(false);
  useEffect(() => {
    if (!import.meta.hot) {
      return;
    }
    if (hotreload) {
      hotreloadSetter(false);
      return;
    }
    import.meta.hot.dispose(() => {
      hotreloadSetter(true);
    });
  }, [hotreload]);

  return hotreload;
};
