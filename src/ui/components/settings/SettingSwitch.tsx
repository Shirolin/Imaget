import React from "react";
import { Switch, SwitchProps, Stack, Text } from "@mantine/core";

type SettingSwitchProps = SwitchProps;

const switchStyles = {
  root: {
    padding: "12px 14px",
    margin: "-4px -14px",
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
    alignItems: "flex-start",
    justifyContent: "space-between",
    width: "100%",
    gap: "var(--mantine-spacing-md)",
  },
  track: {
    transition: "background-color 0.2s ease, border-color 0.2s ease",
    flexShrink: 0,
    marginTop: "2px",
  },
  thumb: {
    transition: "transform 0.4s ease",
  },
  label: {
    paddingLeft: 0,
    paddingRight: 0,
    fontWeight: 500 as const,
    flex: 1,
    lineHeight: 1.4,
  },
  description: {
    paddingLeft: 0,
    marginTop: 2,
    lineHeight: 1.4,
  },
};

export const SettingSwitch: React.FC<SettingSwitchProps> = ({
  label,
  description,
  ...props
}) => {
  return (
    <Switch
      labelPosition="left"
      label={
        <Stack gap={2}>
          <Text size="sm" fw={500}>
            {label}
          </Text>
          {description && (
            <Text size="xs" c="dimmed">
              {description}
            </Text>
          )}
        </Stack>
      }
      {...props}
      styles={switchStyles}
    />
  );
};
