import { Inserts } from "./inserts.jsx";
import { Box } from "/components/box/box.jsx";

export const Modal = ({ name, container, children, insert = {} }) => {
  return (
    <Box.div name={name} role="dialog" className="modal" container={container}>
      <Inserts {...insert}>
        <div name="modal_scrollable_content">{children}</div>
      </Inserts>
    </Box.div>
  );
};
