import insertsStyleSheet from "./inserts.css" with { type: "css" };

export const Inserts = ({ children, Top, Left, Right, Bottom }) => {
  if (!Top && !Left && !Right && !Bottom) {
    return <>{children}</>;
  }
  return (
    <div className="inserts_wrapper">
      <div className="insert_top">{Top}</div>
      <div className="insert_main">
        <div className="insert_left">{Left}</div>
        {children}
        <div className="insert_right">{Right}</div>
      </div>
      <div className="insert_bottom">{Bottom}</div>
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
