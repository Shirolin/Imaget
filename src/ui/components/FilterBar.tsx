import React from "react";
import {
  Group,
  TextInput,
  NumberInput,
  ActionIcon,
  Stack,
  Text,
  CloseButton,
} from "@mantine/core";
import { t } from "../../core/utils/i18n";
import { useDebouncedValue } from "@mantine/hooks";
import {
  IconSearch,
  IconSortAscending,
  IconSortDescending,
  IconLayoutGrid,
  IconLayoutColumns,
  IconLayoutList,
} from "@tabler/icons-react";
import { FilterOptions, ImageFormat, AspectRatioType } from "../../types";
import { PortalSelect, PortalMultiSelect } from "./common/PortalSelect";

interface FilterBarProps {
  options: FilterOptions;
  onChange: (options: FilterOptions) => void;
  portalNode: HTMLDivElement | null;
}

const FilterBar: React.FC<FilterBarProps> = ({
  options,
  onChange,
  portalNode,
}) => {
  const formats: ImageFormat[] = ["PNG", "JPG", "WEBP", "SVG", "GIF"];

  // 1. 本地搜索状态，确保输入流畅
  const [search, setSearch] = React.useState(options.searchQuery);
  // 2. 防抖处理
  const [debouncedSearch] = useDebouncedValue(search, 300);

  // 3. 当防抖值变化且与父组件不同步时，触发父组件更新
  React.useEffect(() => {
    if (debouncedSearch !== options.searchQuery) {
      onChange({ ...options, searchQuery: debouncedSearch });
    }
  }, [debouncedSearch, options, onChange]);

  // 4. 当父组件值从外部改变（如清空按钮）时，同步回本地
  React.useEffect(() => {
    setSearch(options.searchQuery);
  }, [options.searchQuery]);

  return (
    <Stack
      p="md"
      gap="xs"
      style={{ borderBottom: "1px solid var(--mantine-color-dark-4)" }}
    >
      <Group gap="xs" wrap="wrap">
        <TextInput
          placeholder={t("filterSearch")}
          leftSection={<IconSearch size={14} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          rightSectionPointerEvents="all"
          rightSection={
            <CloseButton
              aria-label={t("labelClearSearch")}
              onClick={() => {
                setSearch("");
                onChange({ ...options, searchQuery: "" });
              }}
              style={{ display: search ? undefined : "none" }}
            />
          }
          aria-label={t("labelSearchImages")}
          size="xs"
          flex={1}
          miw={{ base: "100%", xs: 150 }}
        />
        <PortalMultiSelect
          placeholder={t("filterType")}
          data={formats}
          value={options.allowedFormats}
          onChange={(val) =>
            onChange({ ...options, allowedFormats: val as ImageFormat[] })
          }
          clearable
          portalNode={portalNode}
          size="xs"
          flex={1}
          miw={{ base: "100%", xs: 100 }}
        />
      </Group>

      <Group gap="xs" justify="space-between" wrap="wrap">
        <Group gap={4} wrap="nowrap">
          <NumberInput
            aria-label={t("labelMinWidth")}
            value={options.minWidth}
            onChange={(val) => onChange({ ...options, minWidth: Number(val) })}
            size="xs"
            w={{ base: 50, xs: 65 }}
          />
          <Text size="xs" c="dimmed">
            ×
          </Text>
          <NumberInput
            placeholder="H"
            aria-label={t("labelMinHeight")}
            value={options.minHeight}
            onChange={(val) => onChange({ ...options, minHeight: Number(val) })}
            size="xs"
            w={{ base: 50, xs: 65 }}
          />
          <PortalSelect
            placeholder={t("filterLayout")}
            data={[
              { value: "all", label: t("layoutAny") },
              { value: "square", label: t("layoutSquare") },
              { value: "landscape", label: t("layoutWide") },
              { value: "portrait", label: t("layoutTall") },
            ]}
            value={options.aspectRatio}
            onChange={(val) =>
              onChange({
                ...options,
                aspectRatio: (val as AspectRatioType) || "all",
              })
            }
            portalNode={portalNode}
            size="xs"
            miw={{ base: 70, xs: 90 }}
          />
        </Group>

        <Group gap="xs" flex={1} justify="flex-end" wrap="nowrap">
          <PortalSelect
            placeholder={t("sortBy")}
            data={[
              { value: "order", label: t("sortOrder") },
              { value: "size", label: t("sortSize") },
              { value: "resolution", label: t("sortResolution") },
            ]}
            value={options.sortBy}
            onChange={(val) =>
              onChange({
                ...options,
                sortBy: (val as "order" | "size" | "resolution") || "order",
              })
            }
            clearable
            portalNode={portalNode}
            size="xs"
            flex={1}
            miw={80}
            maw={120}
          />

          <Group gap={2} wrap="nowrap" style={{ flexShrink: 0 }}>
            <Group gap={2} wrap="nowrap">
              <ActionIcon
                variant={options.layout === "grid" ? "filled" : "default"}
                size="md"
                onClick={() => onChange({ ...options, layout: "grid" })}
                aria-label={t("labelGridLayout")}
              >
                <IconLayoutGrid size={16} />
              </ActionIcon>
              <ActionIcon
                variant={options.layout === "columns" ? "filled" : "default"}
                size="md"
                onClick={() => onChange({ ...options, layout: "columns" })}
                aria-label={t("labelColumnLayout")}
              >
                <IconLayoutColumns size={16} />
              </ActionIcon>
              <ActionIcon
                variant={options.layout === "list" ? "filled" : "default"}
                size="md"
                onClick={() => onChange({ ...options, layout: "list" })}
                aria-label={t("labelListLayout")}
              >
                <IconLayoutList size={16} />
              </ActionIcon>
            </Group>

            <ActionIcon
              variant="default"
              size="md"
              onClick={() =>
                onChange({
                  ...options,
                  sortDirection:
                    options.sortDirection === "asc" ? "desc" : "asc",
                })
              }
              aria-label={
                options.sortDirection === "asc"
                  ? t("labelSortDesc")
                  : t("labelSortAsc")
              }
            >
              {options.sortDirection === "asc" ? (
                <IconSortAscending size={16} />
              ) : (
                <IconSortDescending size={16} />
              )}
            </ActionIcon>
          </Group>
        </Group>
      </Group>
    </Stack>
  );
};

export default FilterBar;
