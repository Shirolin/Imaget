import { createTheme } from "@mantine/core";

export const FONT_STACK = "Outfit, system-ui, -apple-system, sans-serif";

export const theme = createTheme({
  fontFamily: FONT_STACK,
  primaryColor: "blue",
  defaultRadius: "md",
  cursorType: "pointer",
  components: {
    Card: {
      defaultProps: {
        radius: "md",
        shadow: "sm",
      },
    },
    Button: {
      defaultProps: {
        radius: "md",
      },
    },
    ActionIcon: {
      defaultProps: {
        radius: "md",
      },
    },
    Modal: {
      defaultProps: {
        overlayProps: {
          backgroundOpacity: 0.65,
        },
        padding: "xl",
        radius: "lg",
      },
    },
    Overlay: {
      defaultProps: {
        backgroundOpacity: 0.65,
      },
    },
  },
});
