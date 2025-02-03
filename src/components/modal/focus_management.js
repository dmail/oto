import { findFirstDescendant } from "./dom_traversal.js";

export const firstFocusableDescendantOrSelf = (element) => {
  const firstFocusableDescendant = findFirstDescendant(element, isFocusable);
  if (firstFocusableDescendant) {
    return firstFocusableDescendant;
  }
  if (isFocusable(element)) {
    return element;
  }
  return null;
};

export const isFocusable = (node) => {
  // only element node can be focused, document, textNodes etc cannot
  if (node.nodeType !== 1) {
    return false;
  }
  const nodeName = node.nodeName.toLowerCase();
  if (nodeName === "input") {
    if (node.type === "hidden") {
      return false;
    }
    return isVisible(node);
  }
  if (
    ["button", "select", "datalist", "iframe", "textarea"].indexOf(nodeName) >
    -1
  ) {
    return isVisible(node);
  }
  if (node.hasAttribute("tabindex") || node.hasAttribute("tabIndex")) {
    return isVisible(node);
  }
  if (node.hasAttribute("draggable")) {
    return isVisible(node);
  }
  if (["a", "area"].indexOf(nodeName) > -1) {
    if (node.hasAttribute("href") === false) {
      return false;
    }
    return isVisible(node);
  }
  if (["audio", "video"].indexOf(nodeName) > -1) {
    if (node.hasAttribute("controls") === false) {
      return false;
    }
    return isVisible(node);
  }
  return false;
};
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
// https://github.com/davidtheclark/tabbable/blob/master/index.js
export const isDocumentElement = (node) =>
  node === node.ownerDocument.documentElement;
export const getStyle = (element) =>
  elementToOwnerWindow(element).getComputedStyle(element);
export const getStyleValue = (element, name) =>
  getStyle(element).getPropertyValue(name);

/**
 * elementToOwnerWindow returns the window owning the element.
 * Usually an element window will just be window.
 * But when an element is inside an iframe, the window of that element
 * is iframe.contentWindow
 * It's often important to work with the correct window because
 * element are scoped per iframes.
 */
export const elementToOwnerWindow = (element) => {
  if (elementIsWindow(element)) {
    return element;
  }
  if (elementIsDocument(element)) {
    return element.defaultView;
  }
  return elementToOwnerDocument(element).defaultView;
};
/**
 * elementToOwnerDocument returns the document containing the element.
 * Usually an element document is window.document.
 * But when an element is inside an iframe, the document of that element
 * is iframe.contentWindow.document
 * It's often important to work with the correct document because
 * element are scoped per iframes.
 */
export const elementToOwnerDocument = (element) => {
  if (elementIsWindow(element)) {
    return element.document;
  }
  if (elementIsDocument(element)) {
    return element;
  }
  return element.ownerDocument;
};

export const elementIsWindow = (a) => a.window === a;
export const elementIsDocument = (a) => a.nodeType === 9;
export const elementIsIframe = ({ nodeName }) => nodeName === "IFRAME";
