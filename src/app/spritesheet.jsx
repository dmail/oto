export const SpriteSheet = ({
  url,
  row = 0,
  col = 0,
  colWidth,
  rowHeight,
  gapX = 0,
  gapY = 0,
  width,
  height,
}) => {
  const x = col * colWidth + gapX;
  const y = row * rowHeight + gapY;

  return (
    <div
      style={{
        background: `url(${url})`,
        backgroundPosition: `-${x}px -${y}px`,
        width: `${width}px`,
        height: `${height}px`,
      }}
    ></div>
  );
};
