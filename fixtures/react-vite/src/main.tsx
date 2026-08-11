import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@scout-ui/react/styles.css";
import "@scout-ui/sticker-trail/styles.css";
import "./fixture.css";
import { App } from "./App";

const root = document.querySelector<HTMLDivElement>("#root");

if (root === null) {
  throw new Error("Vite fixture root element is missing");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
