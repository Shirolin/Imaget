import React from "react";
import { Select, MultiSelect } from "@mantine/core";
import type { SelectProps, MultiSelectProps } from "@mantine/core";

interface PortalSelectProps extends SelectProps {
  portalNode: HTMLDivElement | null;
}

export const PortalSelect: React.FC<PortalSelectProps> = ({
  portalNode,
  ...props
}) => {
  const { comboboxProps, ...rest } = props;
  return (
    <Select
      {...rest}
      comboboxProps={{
        portalProps: { target: portalNode || undefined },
        styles: {
          dropdown: { pointerEvents: "auto" as const },
          option: { cursor: "pointer" },
          ...comboboxProps?.styles,
        },
        ...comboboxProps,
      }}
    />
  );
};

interface PortalMultiSelectProps extends MultiSelectProps {
  portalNode: HTMLDivElement | null;
  [key: string]: unknown;
}

export const PortalMultiSelect: React.FC<PortalMultiSelectProps> = ({
  portalNode,
  ...props
}) => {
  const { comboboxProps, ...rest } = props;
  return (
    <MultiSelect
      {...rest}
      comboboxProps={{
        portalProps: { target: portalNode || undefined },
        styles: {
          dropdown: { pointerEvents: "auto" as const },
          option: { cursor: "pointer" },
          ...comboboxProps?.styles,
        },
        ...comboboxProps,
      }}
    />
  );
};
