import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";

// Main/global styles
import "./styles.css";

// Dashboard styles
import "./styles/Dashboard.css";

// Sidebar styles
import "./styles/Sidebar.css";

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);