import React from "react";
import { Select, MultiSelect } from "@mantine/core";
import type { SelectProps, MultiSelectProps } from "@mantine/core";

export const PortalSelect = ({
  portalNode,
  comboboxProps,
  ...props
}: SelectProps & { portalNode: HTMLDivElement | null }) => {
  return (
    <Select
      {...props}
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

export const PortalMultiSelect = ({
  portalNode,
  comboboxProps,
  ...props
}: MultiSelectProps & {
  portalNode: HTMLDivElement | null;
  renderPill?: (props: {
    value: string;
    onRemove: () => void;
  }) => React.ReactNode;
}) => {
  return (
    <MultiSelect
      {...props}
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
