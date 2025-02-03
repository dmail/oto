import insertsStyleSheet from "./inserts.css" with { type: "css" };

export const Inserts = ({ children, Top, Left, Right, Bottom }) => {
  if (!Top && !Left && !Right && !Bottom) {
    return <>{children}</>;
  }
  return (
    <div name="inserts_wrapper">
      <div name="insert_top">{Top}</div>
      <div name="main">
        <div name="insert_left">{Left}</div>
        {children}
        <div name="insert_right">{Right}</div>
      </div>
      <div name="insert_bottom">{Bottom}</div>
    </div>
  );
};

document.adoptedStyleSheets = [
  ...document.adoptedStyleSheets,
  insertsStyleSheet,
];
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
      (s) => s !== insertsStyleSheet,
    );
  });
}
