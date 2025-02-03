import { createPortal } from "preact/compat";
import { useRef } from "preact/hooks";
import { firstFocusableDescendantOrSelf } from "./focus_management.js";
import { Inserts } from "./inserts.jsx";
import modalStyleSheet from "./modal.css" with { type: "css" };
import { Box } from "/components/box/box.jsx";

const ModalOpened = ({
  name,
  container,
  children,
  requestCloseOnClickOutside = false,
  onRequestClose = () => {},
  insert = {},
}) => {
  const modalRef = useRef();

  return createPortal(
    <div name={name} role="dialog" className="modal" tabIndex="-1">
      <Box.div>
        <div
          className="modal_backdrop"
          onMouseDown={(mousedownEvent) => {
            // 1. prevent mousedown on backdrop from putting focus on document.body
            mousedownEvent.preventDefault();
            // 2. transfer focus to the modal content is not already inside
            const modalNode = modalRef.current;
            if (!hasOrContainsFocus(modalNode)) {
              const firstFocusableElement =
                firstFocusableDescendantOrSelf(modalNode);
              if (firstFocusableElement) {
                firstFocusableElement.focus({ preventScroll: true });
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
        <Inserts {...insert}>
          <div name="modal_scrollable_content">{children}</div>
        </Inserts>
      </Box.div>
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
