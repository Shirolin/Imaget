import React, { useState, useEffect } from "react";
import { MantineProvider, ActionIcon } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import App from "./App";
import TestPage from "./TestPage";

const DevApp = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "IMAGET_CLOSE") {
        setVisible(false);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <MantineProvider defaultColorScheme="dark">
      <div
        style={{
          position: "relative",
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <TestPage />
        {visible ? (
          <App />
        ) : (
          <ActionIcon
            size="xl"
            radius="xl"
            variant="filled"
            color="blue"
            style={{
              position: "fixed",
              bottom: 30,
              right: 30,
              zIndex: 99999,
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}
            onClick={() => setVisible(true)}
            title="Open Imaget"
          >
            <IconSearch size={24} />
          </ActionIcon>
        )}
      </div>
    </MantineProvider>
  );
};

export default DevApp;
