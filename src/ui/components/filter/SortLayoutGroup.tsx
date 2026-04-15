import React from "react";
import { Group, ActionIcon, Box } from "@mantine/core";
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
    <Group gap={0} wrap="nowrap">
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
        variant="unstyled"
        w={90}
        styles={{
          input: {
            height: "30px",
            minHeight: "30px",
            fontSize: "12px",
            textAlign: "center",
          },
        }}
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
        variant="unstyled"
        w={100}
        styles={{
          input: {
            height: "30px",
            minHeight: "30px",
            fontSize: "12px",
            textAlign: "center",
          },
        }}
      />

      <Box w={1} h={16} bg="dark.4" opacity={0.3} mx={12} />

      <Group gap={2} wrap="nowrap">
        <ActionIcon
          variant={layout === "grid" ? "light" : "subtle"}
          color={layout === "grid" ? "blue" : "gray"}
          size="sm"
          onClick={() => onChange({ layout: "grid" })}
          h={28}
          w={28}
          radius="sm"
        >
          <IconLayoutGrid size={14} />
        </ActionIcon>
        <ActionIcon
          variant={layout === "columns" ? "light" : "subtle"}
          color={layout === "columns" ? "blue" : "gray"}
          size="sm"
          onClick={() => onChange({ layout: "columns" })}
          h={28}
          w={28}
          radius="sm"
        >
          <IconLayoutColumns size={14} />
        </ActionIcon>
        <ActionIcon
          variant={layout === "list" ? "light" : "subtle"}
          color={layout === "list" ? "blue" : "gray"}
          size="sm"
          onClick={() => onChange({ layout: "list" })}
          h={28}
          w={28}
          radius="sm"
        >
          <IconLayoutList size={14} />
        </ActionIcon>

        <Box w={1} h={16} bg="dark.4" opacity={0.3} mx={8} />

        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          h={28}
          w={28}
          radius="sm"
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
