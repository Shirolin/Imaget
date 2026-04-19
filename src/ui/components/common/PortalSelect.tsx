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
  renderPill,
  ...rest // 这里的 rest 绝对不含 renderPill
}: MultiSelectProps & {
  portalNode: HTMLDivElement | null;
  renderPill?: (props: {
    value: string;
    onRemove: () => void;
  }) => React.ReactNode;
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component: any = MultiSelect;

  return (
    <Component
      {...rest}
      renderPill={renderPill}
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
