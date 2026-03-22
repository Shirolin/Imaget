import React from "react";
import { Switch, SwitchProps } from "@mantine/core";

type SettingSwitchProps = SwitchProps;

const switchStyles = {
  root: {
    cursor: "pointer",
    padding: "8px 12px",
    margin: "-8px -12px",
    borderRadius: "var(--mantine-radius-md)",
    transition: "background-color 0.2s ease, transform 0.1s ease",
    "&:hover": {
      backgroundColor: "var(--mantine-color-dark-6)",
    },
    "&:active": {
      transform: "scale(0.99)",
    },
  },
  track: {
    cursor: "pointer",
    transition: "background-color 0.2s ease, border-color 0.2s ease",
  },
  thumb: {
    transition: "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  },
  label: {
    cursor: "pointer",
    paddingLeft: "12px",
    fontWeight: 500 as const,
  },
};

export const SettingSwitch: React.FC<SettingSwitchProps> = (props) => {
  return <Switch {...props} styles={switchStyles} />;
};
