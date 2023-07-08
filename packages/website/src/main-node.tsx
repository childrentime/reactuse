import { StaticRouter } from "react-router-dom/server";
import { renderToString } from "react-dom/server";
import App from "./App";

export const render = (url: string): string => {
  const jsx = (
    <StaticRouter location={url}>
      <App />
    </StaticRouter>
  );

  const html = renderToString(jsx);

  return html;
};
