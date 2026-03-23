import React from "react";
import { Switch, SwitchProps } from "@mantine/core";

type SettingSwitchProps = SwitchProps;

const switchStyles = {
  root: {
    cursor: "pointer",
    padding: "10px 12px",
    margin: "-2px -12px",
    borderRadius: "var(--mantine-radius-md)",
    transition: "background-color 0.2s ease, transform 0.1s ease",
    "&:hover": {
      backgroundColor: "var(--mantine-color-dark-6)",
    },
    "&:active": {
      transform: "scale(0.995)",
    },
  },
  body: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  track: {
    cursor: "pointer",
    transition: "background-color 0.2s ease, border-color 0.2s ease",
    flexShrink: 0,
  },
  thumb: {
    transition: "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  },
  label: {
    cursor: "pointer",
    paddingLeft: 0,
    paddingRight: "12px",
    fontWeight: 500 as const,
    flex: 1,
    lineHeight: 1.4,
  },
};

export const SettingSwitch: React.FC<SettingSwitchProps> = (props) => {
  return <Switch labelPosition="left" {...props} styles={switchStyles} />;
};
