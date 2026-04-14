import React from "react";
import {
  Select,
  MultiSelect,
} from "@mantine/core";
import type {
  SelectProps,
  MultiSelectProps,
} from "@mantine/core";

interface PortalSelectProps extends SelectProps {
  portalNode: HTMLDivElement | null;
}

export const PortalSelect: React.FC<PortalSelectProps> = ({
  portalNode,
  ...props
}) => {
  return (
    <Select
      {...props}
      comboboxProps={{
        portalProps: { target: portalNode || undefined },
        styles: {
          dropdown: { pointerEvents: "auto" as const },
          option: { cursor: "pointer" },
          ...props.comboboxProps?.styles,
        },
        ...props.comboboxProps,
      }}
    />
  );
};

interface PortalMultiSelectProps extends MultiSelectProps {
  portalNode: HTMLDivElement | null;
}

export const PortalMultiSelect: React.FC<PortalMultiSelectProps> = ({
  portalNode,
  ...props
}) => {
  return (
    <MultiSelect
      {...props}
      comboboxProps={{
        portalProps: { target: portalNode || undefined },
        styles: {
          dropdown: { pointerEvents: "auto" as const },
          option: { cursor: "pointer" },
          ...props.comboboxProps?.styles,
        },
        ...props.comboboxProps,
      }}
    />
  );
};
