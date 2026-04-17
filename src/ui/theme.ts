import { createTheme } from "@mantine/core";

export const FONT_STACK = "Outfit, system-ui, -apple-system, sans-serif";

export const theme = createTheme({
  fontFamily: FONT_STACK,
  primaryColor: "brand",
  colors: {
    brand: [
      "#E0FBFF",
      "#B0F2F7",
      "#81E9F0",
      "#51DFF8",
      "#22D6F1",
      "#04E6F9",
      "#00C6D7",
      "#00A6B5",
      "#008693",
      "#006671",
    ],
  },
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
    TextInput: {
      defaultProps: {
        variant: "filled",
      },
    },
    Autocomplete: {
      defaultProps: {
        variant: "filled",
      },
    },
    Select: {
      defaultProps: {
        variant: "filled",
      },
    },
    MultiSelect: {
      defaultProps: {
        variant: "filled",
      },
    },
    NumberInput: {
      defaultProps: {
        variant: "filled",
      },
    },
  },
});
