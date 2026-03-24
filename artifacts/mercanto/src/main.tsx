import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeApiClient } from "./lib/api";

// Inicializar cliente API con la URL correcta
initializeApiClient();

const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element not found");
}
createRoot(root).render(<App />);
