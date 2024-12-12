export const getAvailableSize = (element) => {
  const { paddingSizes } = getPaddingAndBorderSizes(element);
  const boundingClientRect = element.getBoundingClientRect();
  let availableWidth = boundingClientRect.width;
  let availableHeight = boundingClientRect.height;
  availableWidth -= paddingSizes.left + paddingSizes.right;
  availableHeight -= paddingSizes.top + paddingSizes.bottom;
  return [availableWidth, availableHeight];
};

export const getPaddingAndBorderSizes = (element) => {
  const {
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    borderLeftWidth,
    borderRightWidth,
    borderTopWidth,
    borderBottomWidth,
  } = window.getComputedStyle(element, null);
  return {
    paddingSizes: {
      left: parseFloat(paddingLeft),
      right: parseFloat(paddingRight),
      top: parseFloat(paddingTop),
      bottom: parseFloat(paddingBottom),
    },
    borderSizes: {
      left: parseFloat(borderLeftWidth),
      right: parseFloat(borderRightWidth),
      top: parseFloat(borderTopWidth),
      bottom: parseFloat(borderBottomWidth),
    },
  };
};
