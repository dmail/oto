import { createPortal } from "preact/compat";
import { useLayoutEffect, useRef } from "preact/hooks";
import { findFirstDescendant } from "./dom_traversal.js";
import { isFocusable } from "./focus_management.js";
import { Inserts } from "./inserts.jsx";
import modalStyleSheet from "./modal.css" with { type: "css" };
import { getAncestorScrolls, trapScrollInside } from "./scroll_management.js";
import { Box } from "/components/box/box.jsx";

const ModalOpened = ({
  name,
  container = document.body,
  children,
  requestCloseOnClickOutside = true,
  onRequestClose = () => {},
  insert = {},
  backgroundColor = "white",
}) => {
  const modalRef = useRef();
  useLayoutEffect(() => {
    const modal = modalRef.current;
    const { scrollX, scrollY } = getAncestorScrolls(modal);
    modal.style.left = `${scrollX}px`;
    modal.style.top = `${scrollY}px`;
    return trapScrollInside(modal);
  }, [container]);

  return createPortal(
    <div
      ref={modalRef}
      name={name}
      role="dialog"
      className="modal"
      tabIndex="-1"
    >
      <div
        className="modal_backdrop"
        onMouseDown={(mousedownEvent) => {
          // 1. prevent mousedown on backdrop from putting focus on document.body
          mousedownEvent.preventDefault();
          // 2. transfer focus to the modal content is not already inside
          const modalNode = modalRef.current;
          if (!hasOrContainsFocus(modalNode)) {
            const firstFocusableDescendant = findFirstDescendant(
              modalNode,
              isFocusable,
            );
            if (firstFocusableDescendant) {
              firstFocusableDescendant.focus({ preventScroll: true });
            } else {
              modalNode.focus({ preventScroll: true });
            }
          }
        }}
        onClick={(clickEvent) => {
          if (requestCloseOnClickOutside) {
            clickEvent.stopPropagation();
            onRequestClose(clickEvent);
          }
        }}
      />
      <div style="padding: 20px">
        <Box.div
          className="modal_box"
          backgroundColor={backgroundColor}
          x="center"
          y="center"
          width="400"
          height="200"
          overflow="auto"
          overscrollBehavior="contain"
        >
          <Inserts {...insert}>
            <div className="modal_scrollable_content">{children}</div>
          </Inserts>
        </Box.div>
      </div>
    </div>,
    container,
  );
};
export const Modal = ({ opened = false, ...props }) => {
  if (!opened) {
    return null;
  }
  return <ModalOpened {...props} />;
};

const hasOrContainsFocus = (element) => {
  const { activeElement } = document;
  return element === activeElement || element.contains(activeElement);
};

document.adoptedStyleSheets = [...document.adoptedStyleSheets, modalStyleSheet];
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
      (s) => s !== modalStyleSheet,
    );
  });
}
