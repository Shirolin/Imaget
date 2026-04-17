import React, { memo } from "react";
import { Group, ActionIcon, Tooltip } from "@mantine/core";
import {
  IconSortAscending,
  IconSortDescending,
  IconLayoutGrid,
  IconLayoutColumns,
  IconLayoutList,
} from "@tabler/icons-react";
import { useI18n } from "../../hooks/useI18n";
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

const SortLayoutGroupBase: React.FC<SortLayoutGroupProps> = ({
  aspectRatio,
  sortBy,
  sortDirection,
  layout,
  onChange,
  portalNode,
}) => {
  const { t } = useI18n();
  return (
    <Group gap="xs" wrap="nowrap">
      <PortalSelect
        placeholder={t("filterLayout")}
        aria-label={t("filterLayout")}
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
        w={90}
      />

      <PortalSelect
        placeholder={t("sortBy")}
        aria-label={t("sortBy")}
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
        w={90}
      />

      <Group gap={4} wrap="nowrap">
        <Tooltip
          label={t("layoutGrid") || "Grid"}
          portalProps={{ target: portalNode || undefined }}
        >
          <ActionIcon
            variant={layout === "grid" ? "filled" : "light"}
            size="sm"
            onClick={() => onChange({ layout: "grid" })}
            aria-label={t("layoutGrid") || "Grid"}
          >
            <IconLayoutGrid size={14} />
          </ActionIcon>
        </Tooltip>

        <Tooltip
          label={t("layoutColumns") || "Columns"}
          portalProps={{ target: portalNode || undefined }}
        >
          <ActionIcon
            variant={layout === "columns" ? "filled" : "light"}
            size="sm"
            onClick={() => onChange({ layout: "columns" })}
            aria-label={t("layoutColumns") || "Columns"}
          >
            <IconLayoutColumns size={14} />
          </ActionIcon>
        </Tooltip>

        <Tooltip
          label={t("layoutList") || "List"}
          portalProps={{ target: portalNode || undefined }}
        >
          <ActionIcon
            variant={layout === "list" ? "filled" : "light"}
            size="sm"
            onClick={() => onChange({ layout: "list" })}
            aria-label={t("layoutList") || "List"}
          >
            <IconLayoutList size={14} />
          </ActionIcon>
        </Tooltip>

        <Tooltip
          label={sortDirection === "asc" ? t("sortAsc") : t("sortDesc")}
          portalProps={{ target: portalNode || undefined }}
        >
          <ActionIcon
            variant="light"
            size="sm"
            onClick={() =>
              onChange({
                sortDirection: sortDirection === "asc" ? "desc" : "asc",
              })
            }
            aria-label={sortDirection === "asc" ? t("sortAsc") : t("sortDesc")}
          >
            {sortDirection === "asc" ? (
              <IconSortAscending size={14} />
            ) : (
              <IconSortDescending size={14} />
            )}
          </ActionIcon>
        </Tooltip>
      </Group>
    </Group>
  );
};

export const SortLayoutGroup = memo(SortLayoutGroupBase);
export default SortLayoutGroup;
