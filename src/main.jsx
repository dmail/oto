import { render } from "preact";
import { useErrorBoundary } from "preact/hooks";
import { App } from "./app/app.jsx";

const AppWithErrorBoundary = () => {
  const [error] = useErrorBoundary();
  if (error) {
    return `An error occurred: ${error.message}`;
  }
  return <App />;
};

render(<AppWithErrorBoundary />, document.querySelector("#root"));
