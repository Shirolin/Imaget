import React from "react";
import {
  Group,
  TextInput,
  NumberInput,
  ActionIcon,
  Stack,
  CloseButton,
  Tooltip,
  Badge,
  UnstyledButton,
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
  const formats: ImageFormat[] = [
    "PNG",
    "JPG",
    "WEBP",
    "SVG",
    "GIF",
    "AVIF",
    "BMP",
    "ICO",
    "TIFF",
    "HEIC",
    "HEIF",
  ];

  // 1. 本地搜索状态，确保输入流畅
  const [search, setSearch] = React.useState(options.searchQuery);
  const [exclude, setExclude] = React.useState(options.excludeKeywords);

  // 用 Ref 始终跟踪最新的 options，供异步的 useEffect 使用，防止由于闭包导致的“状态回滚”
  const latestOptionsRef = React.useRef(options);

  React.useLayoutEffect(() => {
    latestOptionsRef.current = options;
  }, [options]);

  // 2. 防抖处理
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [debouncedExclude] = useDebouncedValue(exclude, 300);

  // 3. 当防抖值变化且与父组件不同步时，触发父组件更新
  React.useEffect(() => {
    // 只有当防抖后的值与当前输入值一致时（说明由于延迟捕获到了最新意图），才推送到父组件
    // 这样可以防止手动清空（立即更新 options）后被旧的防抖值覆盖回去
    if (debouncedSearch === search && debouncedSearch !== options.searchQuery) {
      onChange({ ...latestOptionsRef.current, searchQuery: debouncedSearch });
    }
  }, [debouncedSearch, search, options.searchQuery, onChange]);

  React.useEffect(() => {
    if (
      debouncedExclude === exclude &&
      debouncedExclude !== options.excludeKeywords
    ) {
      onChange({
        ...latestOptionsRef.current,
        excludeKeywords: debouncedExclude,
      });
    }
  }, [debouncedExclude, exclude, options.excludeKeywords, onChange]);

  // 4. 当父组件值从外部改变（如清空按钮）时，同步回本地
  React.useEffect(() => {
    setSearch(options.searchQuery);
  }, [options.searchQuery]);

  React.useEffect(() => {
    setExclude(options.excludeKeywords);
  }, [options.excludeKeywords]);

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
                onChange({ ...latestOptionsRef.current, searchQuery: "" });
              }}
              style={{ display: search ? undefined : "none" }}
            />
          }
          aria-label={t("labelSearchImages")}
          size="xs"
          flex={1.2}
          miw={{ base: "100%", xs: 150 }}
        />
        <TextInput
          placeholder={t("filterExclude")}
          leftSection={
            <IconSearchOff
              size={14}
              style={{ color: "var(--mantine-color-dimmed)" }}
            />
          }
          value={exclude}
          onChange={(e) => setExclude(e.currentTarget.value)}
          rightSectionPointerEvents="all"
          rightSection={
            <CloseButton
              aria-label={t("labelClearExclude")}
              onClick={() => {
                setExclude("");
                onChange({ ...latestOptionsRef.current, excludeKeywords: "" });
              }}
              style={{ display: exclude ? undefined : "none" }}
            />
          }
          aria-label={t("filterExclude")}
          size="xs"
          flex={1}
          miw={{ base: "100%", xs: 150 }}
        />
        <PortalMultiSelect
          placeholder={t("filterType")}
          data={formats}
          value={options.allowedFormats}
          onChange={(val) =>
            onChange({
              ...latestOptionsRef.current,
              allowedFormats: val as ImageFormat[],
            })
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
            onChange={(val) =>
              onChange({ ...latestOptionsRef.current, minWidth: Number(val) })
            }
            size="xs"
            w={{ base: 50, xs: 65 }}
          />
          <Tooltip
            label={
              options.resolutionMode === "or"
                ? t("resModeOr") === "OR" // 简单的启发式判断
                  ? "Match either width OR height"
                  : t("resModeOrDesc")
                : t("resModeAnd") === "AND"
                  ? "Match both width AND height"
                  : t("resModeAndDesc")
            }
            portalProps={{ target: portalNode || undefined }}
            withArrow
          >
            <UnstyledButton
              onClick={() =>
                onChange({
                  ...latestOptionsRef.current,
                  resolutionMode:
                    options.resolutionMode === "or" ? "and" : "or",
                })
              }
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 4px",
              }}
            >
              <Badge
                size="xs"
                variant="light"
                color={options.resolutionMode === "or" ? "blue" : "teal"}
                radius="sm"
                px={4}
                style={{ cursor: "pointer", userSelect: "none" }}
              >
                {options.resolutionMode === "or"
                  ? t("resModeOr")
                  : t("resModeAnd")}
              </Badge>
            </UnstyledButton>
          </Tooltip>
          <NumberInput
            placeholder="H"
            aria-label={t("labelMinHeight")}
            value={options.minHeight}
            onChange={(val) =>
              onChange({ ...latestOptionsRef.current, minHeight: Number(val) })
            }
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
                ...latestOptionsRef.current,
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
                ...latestOptionsRef.current,
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
                onClick={() =>
                  onChange({ ...latestOptionsRef.current, layout: "grid" })
                }
                aria-label={t("labelGridLayout")}
              >
                <IconLayoutGrid size={16} />
              </ActionIcon>
              <ActionIcon
                variant={options.layout === "columns" ? "filled" : "default"}
                size="md"
                onClick={() =>
                  onChange({ ...latestOptionsRef.current, layout: "columns" })
                }
                aria-label={t("labelColumnLayout")}
              >
                <IconLayoutColumns size={16} />
              </ActionIcon>
              <ActionIcon
                variant={options.layout === "list" ? "filled" : "default"}
                size="md"
                onClick={() =>
                  onChange({ ...latestOptionsRef.current, layout: "list" })
                }
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
                  ...latestOptionsRef.current,
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
