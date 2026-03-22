import React from "react";
import ReactDOM from "react-dom/client";
import "@mantine/core/styles.css";
import DevApp from "./ui/DevApp";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DevApp />
  </React.StrictMode>,
);
