import React from "react";
import { Select, MultiSelect } from "@mantine/core";
import type { SelectProps, MultiSelectProps } from "@mantine/core";

interface PortalSelectProps extends SelectProps {
  portalNode: HTMLDivElement | null;
}

export const PortalSelect = ({
  portalNode,
  comboboxProps,
  ...props
}: PortalSelectProps) => {
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

// 🚀 核心修复：显式包含 renderPill 类型以解决 TypeScript 报错及属性泄露
export interface PortalMultiSelectProps extends MultiSelectProps {
  portalNode: HTMLDivElement | null;
  renderPill?: (props: {
    value: string;
    onRemove: () => void;
  }) => React.ReactNode;
}

export const PortalMultiSelect = ({
  portalNode,
  comboboxProps,
  renderPill, // 剥离 renderPill，防止其进入下面的 ...props 并泄露到 DOM
  ...props
}: PortalMultiSelectProps) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component: any = MultiSelect;

  return (
    <Component
      {...props}
      renderPill={renderPill} // 显式传回
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
