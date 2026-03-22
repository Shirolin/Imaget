import React from "react";
import { ActionIcon, ActionIconProps, TooltipProps } from "@mantine/core";
import { PortalTooltip } from "./PortalTooltip";

interface GlassActionIconProps extends ActionIconProps {
  label: string;
  portalNode: HTMLDivElement | null;
  tooltipProps?: Partial<TooltipProps>;
  icon: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
}

export const GlassActionIcon: React.FC<GlassActionIconProps> = ({
  label,
  portalNode,
  tooltipProps,
  icon,
  onClick,
  ...props
}) => {
  return (
    <PortalTooltip
      label={label}
      position="top"
      portalNode={portalNode}
      {...tooltipProps}
    >
      <ActionIcon
        variant="subtle"
        color="gray.0"
        size="md"
        radius="xl"
        onClick={onClick}
        {...props}
        styles={{
          root: {
            "&:hover": {
              backgroundColor: "var(--mantine-color-dark-4)",
              transform: "scale(1.05)",
            },
            transition: "all 0.2s ease",
          },
        }}
      >
        {icon}
      </ActionIcon>
    </PortalTooltip>
  );
};
