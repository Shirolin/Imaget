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
    <Group gap="xs" wrap="nowrap">
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
        variant="filled"
        w={100}
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
        variant="filled"
        w={100}
      />

      <Group gap={4} wrap="nowrap">
        <ActionIcon
          variant={layout === "grid" ? "filled" : "light"}
          size="sm"
          onClick={() => onChange({ layout: "grid" })}
        >
          <IconLayoutGrid size={14} />
        </ActionIcon>
        <ActionIcon
          variant={layout === "columns" ? "filled" : "light"}
          size="sm"
          onClick={() => onChange({ layout: "columns" })}
        >
          <IconLayoutColumns size={14} />
        </ActionIcon>
        <ActionIcon
          variant={layout === "list" ? "filled" : "light"}
          size="sm"
          onClick={() => onChange({ layout: "list" })}
        >
          <IconLayoutList size={14} />
        </ActionIcon>

        <ActionIcon
          variant="light"
          size="sm"
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
