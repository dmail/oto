import { Inserts } from "./inserts.jsx";
import { Box } from "/components/box/box.jsx";

export const Modal = ({ container, children, insert = {} }) => {
  return (
    <Box.div role="dialog" container={container}>
      <Inserts {...insert}>
        <div name="modal_scrollable_content">{children}</div>
      </Inserts>
    </Box.div>
  );
};
