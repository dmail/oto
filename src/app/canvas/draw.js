let displayDrawPoints = false;

export const drawPoint = (context, [x, y], { color } = {}) => {
  context.beginPath();
  context.arc(x, y, 2, 0, Math.PI * 2);
  if (color) {
    context.fillStyle = color;
    context.fill();
  }
};

export const drawLine = (context, start, end, { color } = {}) => {
  context.beginPath();
  context.moveTo(start[0], start[1]);
  context.lineTo(end[0], end[1]);
  if (color) {
    context.strokeStyle = color;
    context.stroke();
  }
  if (displayDrawPoints) {
    drawPoint(context, start, { color: "aqua" });
    drawPoint(context, end, { color: "chocolate" });
  }
};

export const drawArc = (
  context,
  center,
  radius,
  fromDegrees,
  toDegrees,
  { color } = {},
) => {
  const [centerX, centerY] = center;
  context.beginPath();
  context.arc(
    centerX,
    centerY,
    radius,
    radianFromDegree(fromDegrees),
    radianFromDegree(toDegrees),
  );
  if (color) {
    context.strokeStyle = color;
    context.stroke();
  }
  if (displayDrawPoints) {
    drawPoint(context, center, { color: "chartreuse" });
  }
};
export const radianFromDegree = (degrees) => {
  return degrees * (Math.PI / 180);
};

export const drawArcTo = (
  context,
  start,
  controlPoint,
  end,
  radius,
  { color } = {},
) => {
  if (radius < 0) {
    return;
  }
  context.beginPath();
  context.moveTo(start[0], start[1]);
  context.arcTo(controlPoint[0], controlPoint[1], end[0], end[1], radius);
  if (color) {
    context.strokeStyle = color;
    context.stroke();
  }
  if (displayDrawPoints) {
    drawPoint(context, start, { color: "chartreuse" });
    drawPoint(context, controlPoint, { color: "violet" });
    drawPoint(context, end, { color: "chartreuse" });
  }
};
