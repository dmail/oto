import { getStyleValue, isDocumentElement } from "./dom_util.js";

export const isVisible = (node) => {
  if (isDocumentElement(node)) {
    return true;
  }
  if (getStyleValue(node, "visibility") === "hidden") {
    return false;
  }
  let nodeOrAncestor = node;
  while (nodeOrAncestor) {
    if (isDocumentElement(nodeOrAncestor)) {
      break;
    }
    if (getStyleValue(nodeOrAncestor, "display") === "none") {
      return false;
    }
    nodeOrAncestor = nodeOrAncestor.parentNode;
  }
  return true;
};
