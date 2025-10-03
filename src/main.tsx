import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const container = document.getElementById("root");

if (container) {
  createRoot(container).render(<App />);
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .catch((error) => console.error("Service worker registration failed", error));
  });
}
