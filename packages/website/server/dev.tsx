import express from "express";
import { renderPage } from "./common";

const app = express();

// DEV SSR
app.get("*", (req, res) => {
  const html = renderPage(req.url);
  res.set("content-type", "text/html");
  res.send(html);
});

export default app;
