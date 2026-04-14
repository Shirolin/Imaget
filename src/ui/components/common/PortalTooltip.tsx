import React from "react";
import { Tooltip } from "@mantine/core";
import type { TooltipProps } from "@mantine/core";

interface PortalTooltipProps extends TooltipProps {
  portalNode: HTMLDivElement | null;
}

export const PortalTooltip: React.FC<PortalTooltipProps> = ({
  portalNode,
  children,
  ...props
}) => {
  return (
    <Tooltip
      {...props}
      portalProps={{ target: portalNode || undefined, ...props.portalProps }}
    >
      {children}
    </Tooltip>
  );
};
