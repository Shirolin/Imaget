import { useState, useEffect } from "react";
import { MantineProvider, ActionIcon, Box } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";

import { IconSearch } from "@tabler/icons-react";
import App from "./App";
import TestPage from "./TestPage";
import { theme } from "./theme";

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
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <ModalsProvider>
        <Box pos="relative" w="100vw" h="100vh" style={{ overflowY: "auto" }}>
          <TestPage />
          {visible ? (
            <App />
          ) : (
            <ActionIcon
              size="xl"
              radius="xl"
              variant="filled"
              color="brand"
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
        </Box>
      </ModalsProvider>
    </MantineProvider>
  );
};

export default DevApp;
