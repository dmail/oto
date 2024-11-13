export const translateY = (to) => {
  return {
    steps: [
      {
        transform: `translateY(${to}px)`,
      },
    ],
  };
};
