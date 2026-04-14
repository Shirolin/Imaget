import React from "react";
import { Group, ActionIcon } from "@mantine/core";
import {
  IconSortAscending,
  IconSortDescending,
  IconLayoutGrid,
  IconLayoutColumns,
  IconLayoutList,
} from "@tabler/icons-react";
import { t } from "../../../core/utils/i18n";
import type { AspectRatioType, FilterOptions } from "../../../types";
import { PortalSelect } from "../common/PortalSelect";

interface SortLayoutGroupProps {
  aspectRatio: AspectRatioType;
  sortBy: "order" | "size" | "resolution";
  sortDirection: "asc" | "desc";
  layout: "grid" | "columns" | "list";
  onChange: (updates: Partial<FilterOptions>) => void;
  portalNode: HTMLDivElement | null;
}

const SortLayoutGroup: React.FC<SortLayoutGroupProps> = ({
  aspectRatio,
  sortBy,
  sortDirection,
  layout,
  onChange,
  portalNode,
}) => {
  return (
    <Group gap="xs" flex={1} justify="flex-end" wrap="wrap">
      <PortalSelect
        placeholder={t("filterLayout")}
        data={[
          { value: "all", label: t("layoutAny") },
          { value: "square", label: t("layoutSquare") },
          { value: "landscape", label: t("layoutWide") },
          { value: "portrait", label: t("layoutTall") },
        ]}
        value={aspectRatio}
        onChange={(val) =>
          onChange({
            aspectRatio: (val as AspectRatioType) || "all",
          })
        }
        portalNode={portalNode}
        size="xs"
        miw={90}
        flex={{ base: 1, xs: "none" }}
      />

      <PortalSelect
        placeholder={t("sortBy")}
        data={[
          { value: "order", label: t("sortOrder") },
          { value: "size", label: t("sortSize") },
          { value: "resolution", label: t("sortResolution") },
        ]}
        value={sortBy}
        onChange={(val) =>
          onChange({
            sortBy: (val as "order" | "size" | "resolution") || "order",
          })
        }
        portalNode={portalNode}
        size="xs"
        miw={100}
        flex={{ base: 1, xs: "none" }}
      />

      <Group gap="xs" wrap="nowrap">
        <Group
          gap={0}
          wrap="nowrap"
          style={{
            border: "1px solid var(--mantine-color-dark-4)",
            borderRadius: "6px",
            overflow: "hidden",
          }}
        >
          <ActionIcon
            variant={layout === "grid" ? "filled" : "subtle"}
            color={layout === "grid" ? "blue" : "gray"}
            size="sm"
            onClick={() => onChange({ layout: "grid" })}
            radius={0}
            h={30}
            w={30}
          >
            <IconLayoutGrid size={14} />
          </ActionIcon>
          <ActionIcon
            variant={layout === "columns" ? "filled" : "subtle"}
            color={layout === "columns" ? "blue" : "gray"}
            size="sm"
            onClick={() => onChange({ layout: "columns" })}
            radius={0}
            h={30}
            w={30}
            style={{
              borderLeft: "1px solid var(--mantine-color-dark-4)",
              borderRight: "1px solid var(--mantine-color-dark-4)",
            }}
          >
            <IconLayoutColumns size={14} />
          </ActionIcon>
          <ActionIcon
            variant={layout === "list" ? "filled" : "subtle"}
            color={layout === "list" ? "blue" : "gray"}
            size="sm"
            onClick={() => onChange({ layout: "list" })}
            radius={0}
            h={30}
            w={30}
          >
            <IconLayoutList size={14} />
          </ActionIcon>
        </Group>

        <ActionIcon
          variant="default"
          size="sm"
          h={30}
          w={30}
          onClick={() =>
            onChange({
              sortDirection: sortDirection === "asc" ? "desc" : "asc",
            })
          }
        >
          {sortDirection === "asc" ? (
            <IconSortAscending size={14} />
          ) : (
            <IconSortDescending size={14} />
          )}
        </ActionIcon>
      </Group>
    </Group>
  );
};

export default SortLayoutGroup;
