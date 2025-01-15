export const createAnimationAbortError = () => {
  const animationAbortError = new Error("Animation aborted");
  animationAbortError.name = "AbortError";
  animationAbortError.isAnimationAbortError = true;
  return animationAbortError;
};

window.addEventListener("unhandledrejection", (event) => {
  const { reason } = event;
  if (reason && reason.name === "AbortError" && reason.isAnimationAbortError) {
    event.preventDefault();
  }
});
