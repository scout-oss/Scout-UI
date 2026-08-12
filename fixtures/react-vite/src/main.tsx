import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// Broad consumer: one stylesheet. The standalone Trail stylesheet is verified
// separately by the isolated `standalone-trail` entry.
import "@scout-ui/react/styles.css";
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
