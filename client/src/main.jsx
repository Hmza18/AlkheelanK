import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { applyTheme, readStoredTheme } from "./lib/themes.js";
import App from "./App.jsx";
import "./index.css";

applyTheme(readStoredTheme());

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
