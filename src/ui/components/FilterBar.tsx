import React from "react";
import {
  Group,
  NumberInput,
  ActionIcon,
  Stack,
  CloseButton,
  Tooltip,
  UnstyledButton,
  Autocomplete,
  Text,
  Box,
} from "@mantine/core";
import { t } from "../../core/utils/i18n";
import { useDebouncedValue } from "@mantine/hooks";
import {
  IconSearch,
  IconSearchOff,
  IconSortAscending,
  IconSortDescending,
  IconLayoutGrid,
  IconLayoutColumns,
  IconLayoutList,
  IconPhoto,
  IconPhotoOff,
} from "@tabler/icons-react";
import type { FilterOptions, ImageFormat, AspectRatioType } from "../../types";
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
  const formats: ImageFormat[] = [
    "PNG", "JPG", "WEBP", "SVG", "GIF", "AVIF", "BMP", "ICO", "TIFF", "HEIC", "HEIF", "DPG",
  ];

  // 1. 本地搜索状态
  const [search, setSearch] = React.useState(options.searchQuery);
  const [exclude, setExclude] = React.useState(options.excludeKeywords);

  const latestOptionsRef = React.useRef(options);
  React.useLayoutEffect(() => {
    latestOptionsRef.current = options;
  }, [options]);

  // 2. 防抖处理
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [debouncedExclude] = useDebouncedValue(exclude, 300);

  // 3. 同步到父组件
  React.useEffect(() => {
    if (debouncedSearch === search && debouncedSearch !== options.searchQuery) {
      onChange({ ...latestOptionsRef.current, searchQuery: debouncedSearch });
    }
  }, [debouncedSearch, search, options.searchQuery, onChange]);

  React.useEffect(() => {
    if (debouncedExclude === exclude && debouncedExclude !== options.excludeKeywords) {
      onChange({ ...latestOptionsRef.current, excludeKeywords: debouncedExclude });
    }
  }, [debouncedExclude, exclude, options.excludeKeywords, onChange]);

  // 4. 从父组件同步回本地
  React.useEffect(() => {
    setSearch(options.searchQuery);
  }, [options.searchQuery]);

  React.useEffect(() => {
    setExclude(options.excludeKeywords);
  }, [options.excludeKeywords]);

  return (
    <Stack
      p="sm"
      gap="xs"
      bg="dark.8"
      style={{
        borderBottom: "1px solid var(--mantine-color-dark-4)",
        zIndex: 10,
      }}
    >
      {/* 行 1: 文本搜索与排除 */}
      <Group gap="xs" wrap="wrap" align="flex-start">
        <Autocomplete
          placeholder={t("filterSearch")}
          leftSection={<IconSearch size={14} />}
          data={["avatar", "background", "banner", "icon", "logo", "wallpaper", "photo", "header", "footer", "thumbnail", "cover"]}
          value={search}
          onChange={setSearch}
          rightSectionPointerEvents="all"
          rightSection={
            <CloseButton
              aria-label={t("labelClearSearch")}
              onClick={() => {
                setSearch("");
                onChange({ ...latestOptionsRef.current, searchQuery: "" });
              }}
              style={{ display: search ? undefined : "none" }}
              size="sm"
            />
          }
          size="xs"
          flex={1.5}
          miw={160}
          styles={{ input: { backgroundColor: "var(--mantine-color-dark-9)" } }}
        />
        <Autocomplete
          placeholder={t("filterExclude")}
          leftSection={<IconSearchOff size={14} style={{ color: "var(--mantine-color-dimmed)" }} />}
          data={["ads", "pixel", "spacer", "tracking", "spinner", "loader", "dot", "line", "blank", "empty"]}
          value={exclude}
          onChange={setExclude}
          rightSectionPointerEvents="all"
          rightSection={
            <CloseButton
              aria-label={t("labelClearExclude")}
              onClick={() => {
                setExclude("");
                onChange({ ...latestOptionsRef.current, excludeKeywords: "" });
              }}
              style={{ display: exclude ? undefined : "none" }}
              size="sm"
            />
          }
          size="xs"
          flex={1}
          miw={120}
          styles={{ input: { backgroundColor: "var(--mantine-color-dark-9)" } }}
        />
        
        <PortalMultiSelect
          placeholder={t("filterType")}
          leftSection={<IconPhoto size={14} />}
          data={formats}
          value={options.allowedFormats}
          onChange={(val) =>
            onChange({ ...latestOptionsRef.current, allowedFormats: val as ImageFormat[] })
          }
          clearable
          portalNode={portalNode}
          size="xs"
          flex={1.2}
          miw={140}
          maxValues={2}
          styles={{
            input: { backgroundColor: "var(--mantine-color-dark-9)", minHeight: "30px" },
            pill: { height: "20px", fontSize: "10px" }
          }}
        />
        
        <PortalMultiSelect
          placeholder={t("filterExcludeType")}
          leftSection={<IconPhotoOff size={14} color="var(--mantine-color-red-6)" />}
          data={formats}
          value={options.excludeFormats}
          onChange={(val) =>
            onChange({ ...latestOptionsRef.current, excludeFormats: val as ImageFormat[] })
          }
          clearable
          portalNode={portalNode}
          size="xs"
          flex={1}
          miw={120}
          maxValues={2}
          styles={{
            input: { backgroundColor: "var(--mantine-color-dark-9)", minHeight: "30px" },
            pill: { height: "20px", fontSize: "10px" }
          }}
        />
      </Group>

      {/* 行 2: 尺寸、布局与排序 */}
      <Group gap="xs" justify="space-between" wrap="wrap">
        <Group gap="xs" wrap="nowrap">
          <Group gap={2} wrap="nowrap">
            <NumberInput
              aria-label={t("labelMinWidth")}
              value={options.minWidth}
              placeholder="W"
              onChange={(val) => onChange({ ...latestOptionsRef.current, minWidth: Number(val) })}
              size="xs"
              w={60}
              variant="filled"
              styles={{ input: { textAlign: "center", backgroundColor: "var(--mantine-color-dark-9)" } }}
            />
            <Tooltip
              label={options.resolutionMode === "or" ? t("resModeOrDesc") : t("resModeAndDesc")}
              portalProps={{ target: portalNode || undefined }}
              withArrow
              withinPortal
            >
              <UnstyledButton
                onClick={() =>
                  onChange({
                    ...latestOptionsRef.current,
                    resolutionMode: options.resolutionMode === "or" ? "and" : "or",
                  })
                }
                px={4}
                h={30}
                style={{
                  display: "flex",
                  alignItems: "center",
                  borderRadius: "4px",
                  backgroundColor: "var(--mantine-color-dark-9)",
                  border: "1px solid var(--mantine-color-dark-4)",
                }}
              >
                <Text size="10px" fw={700} c={options.resolutionMode === "or" ? "blue.4" : "teal.4"}>
                  {options.resolutionMode === "or" ? t("resModeOr") : t("resModeAnd")}
                </Text>
              </UnstyledButton>
            </Tooltip>
            <NumberInput
              placeholder="H"
              aria-label={t("labelMinHeight")}
              value={options.minHeight}
              onChange={(val) => onChange({ ...latestOptionsRef.current, minHeight: Number(val) })}
              size="xs"
              w={60}
              variant="filled"
              styles={{ input: { textAlign: "center", backgroundColor: "var(--mantine-color-dark-9)" } }}
            />
          </Group>

          <Box w={1} h={20} bg="dark.4" opacity={0.5} mx={2} />

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
              onChange({ ...latestOptionsRef.current, aspectRatio: (val as AspectRatioType) || "all" })
            }
            portalNode={portalNode}
            size="xs"
            w={90}
            styles={{ input: { backgroundColor: "var(--mantine-color-dark-9)" } }}
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
              onChange({ ...latestOptionsRef.current, sortBy: (val as "order" | "size" | "resolution") || "order" })
            }
            portalNode={portalNode}
            size="xs"
            w={100}
            styles={{ input: { backgroundColor: "var(--mantine-color-dark-9)" } }}
          />

          <Group gap={0} wrap="nowrap" style={{ border: "1px solid var(--mantine-color-dark-4)", borderRadius: "6px", overflow: "hidden" }}>
            <ActionIcon
              variant={options.layout === "grid" ? "filled" : "subtle"}
              color={options.layout === "grid" ? "blue" : "gray"}
              size="sm"
              onClick={() => onChange({ ...latestOptionsRef.current, layout: "grid" })}
              radius={0}
              h={30}
              w={30}
            >
              <IconLayoutGrid size={14} />
            </ActionIcon>
            <ActionIcon
              variant={options.layout === "columns" ? "filled" : "subtle"}
              color={options.layout === "columns" ? "blue" : "gray"}
              size="sm"
              onClick={() => onChange({ ...latestOptionsRef.current, layout: "columns" })}
              radius={0}
              h={30}
              w={30}
              style={{ borderLeft: "1px solid var(--mantine-color-dark-4)", borderRight: "1px solid var(--mantine-color-dark-4)" }}
            >
              <IconLayoutColumns size={14} />
            </ActionIcon>
            <ActionIcon
              variant={options.layout === "list" ? "filled" : "subtle"}
              color={options.layout === "list" ? "blue" : "gray"}
              size="sm"
              onClick={() => onChange({ ...latestOptionsRef.current, layout: "list" })}
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
                ...latestOptionsRef.current,
                sortDirection: options.sortDirection === "asc" ? "desc" : "asc",
              })
            }
          >
            {options.sortDirection === "asc" ? (
              <IconSortAscending size={14} />
            ) : (
              <IconSortDescending size={14} />
            )}
          </ActionIcon>
        </Group>
      </Group>
    </Stack>
  );
};

export default FilterBar;
