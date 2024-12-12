export const splitLines = (text, maxLines) => {
  const lines = [];
  let currentLineChildren = [];
  for (const child of text) {
    if (typeof child === "string") {
      for (const char of child.split("")) {
        if (char === "\n") {
          lines.push(currentLineChildren);
          currentLineChildren = [];
          continue;
        }
        currentLineChildren.push(char);
      }
    } else if (child.type === "br") {
      lines.push(currentLineChildren);
      currentLineChildren = [];
    } else {
      currentLineChildren.push(child);
    }
    if (maxLines && lines.length >= maxLines) {
      break;
    }
  }
  if ((currentLineChildren.length && !maxLines) || lines.length < maxLines) {
    lines.push(currentLineChildren);
  }
  return lines;
};
