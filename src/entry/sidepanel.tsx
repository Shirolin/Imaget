import React from "react";
import ReactDOM from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import App from "../ui/App";
import { theme } from "../ui/theme";
import "@mantine/core/styles.css";
// Side panel uses standard CSS (no shadow DOM inline styles necessary)

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider theme={theme} forceColorScheme="dark">
      <App />
    </MantineProvider>
  </React.StrictMode>,
);
