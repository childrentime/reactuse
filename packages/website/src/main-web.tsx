import ClipboardJS from "clipboard";
import React from "react";
import { hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { toast } from "react-toastify";
import App from "./App";

const clip = new ClipboardJS(".markdown-it-code-copy");
clip.on("success", () => {
  toast.success("Copied", {
    position: toast.POSITION.TOP_CENTER,
  });
});

const root = document.getElementById("main") as HTMLElement;
hydrateRoot(
  root,
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
