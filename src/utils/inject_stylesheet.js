export const injectStylesheet = (stylesheet) => {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, stylesheet];
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
        (s) => s !== stylesheet,
      );
    });
  }
};
