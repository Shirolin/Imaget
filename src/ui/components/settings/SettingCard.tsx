import React from "react";
import { Card, Group, Text, Divider, Stack } from "@mantine/core";

interface SettingCardProps {
  icon: React.ReactNode;
  title: string;
  iconColor?: string;
  children: React.ReactNode;
}

const cardStyle = {
  transition: "all 0.2s ease",
  backgroundColor: "var(--mantine-color-dark-7)",
  "&:hover": {
    backgroundColor: "var(--mantine-color-dark-6)",
    borderColor: "var(--mantine-color-blue-filled)",
    boxShadow: "var(--mantine-shadow-sm)",
  },
};

export const SettingCard: React.FC<SettingCardProps> = ({
  icon,
  title,
  iconColor,
  children,
}) => {
  return (
    <Card withBorder radius="md" p="md" styles={{ root: cardStyle }}>
      <Group mb="xs" gap="xs">
        {React.isValidElement(icon)
          ? React.cloneElement(
              icon as React.ReactElement<{
                size?: number;
                color?: string;
                "aria-hidden"?: string;
              }>,
              {
                size: 18,
                color: iconColor || "inherit",
                "aria-hidden": "true",
              },
            )
          : icon}
        <Text fw={600} size="sm" style={{ letterSpacing: "0.5px" }}>
          {title}
        </Text>
      </Group>
      <Divider mb="md" />
      <Stack gap="md">{children}</Stack>
    </Card>
  );
};
