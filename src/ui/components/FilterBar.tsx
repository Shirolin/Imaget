import React from "react";
import { Group, Stack } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import type { FilterOptions } from "../../types";
import SearchGroup from "./filter/SearchGroup";
import FilterGroup from "./filter/FilterGroup";
import SortLayoutGroup from "./filter/SortLayoutGroup";

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

  // 4. 从父组件同步回本地
  React.useEffect(() => {
    setSearch(options.searchQuery);
  }, [options.searchQuery]);

  React.useEffect(() => {
    setExclude(options.excludeKeywords);
  }, [options.excludeKeywords]);

  const handleUpdate = (updates: Partial<FilterOptions>) => {
    onChange({ ...latestOptionsRef.current, ...updates });
  };

  return (
    <Stack
      gap="xs"
      p="md"
      bg="dark.8"
      style={{
        borderBottom: "1px solid var(--mantine-color-dark-4)",
        zIndex: 10,
      }}
    >
      {/* 
         核心重构：将 SearchGroup 和 FilterGroup 的输入框放在同一个 Group 中平铺
         这样在窄屏下触发 100% 宽度时，它们的 Flex 表现完全一致。
      */}
      <Group gap="xs" wrap="wrap" align="center">
        <SearchGroup
          searchQuery={search}
          onSearchChange={setSearch}
          excludeKeywords={exclude}
          onExcludeKeywordsChange={setExclude}
          onClearSearch={() => {
            setSearch("");
            handleUpdate({ searchQuery: "" });
          }}
          onClearExclude={() => {
            setExclude("");
            handleUpdate({ excludeKeywords: "" });
          }}
        />
        <FilterGroup
          allowedFormats={options.allowedFormats}
          excludeFormats={options.excludeFormats}
          minWidth={options.minWidth}
          minHeight={options.minHeight}
          resolutionMode={options.resolutionMode}
          onChange={handleUpdate}
          portalNode={portalNode}
        />

        {/* 排序与布局组在空间不足时会自动换行 */}
        <Group grow flex={{ base: "1 0 100%", md: "none" }} justify="flex-end">
          <SortLayoutGroup
            aspectRatio={options.aspectRatio}
            sortBy={options.sortBy}
            sortDirection={options.sortDirection}
            layout={options.layout}
            onChange={handleUpdate}
            portalNode={portalNode}
          />
        </Group>
      </Group>
    </Stack>
  );
};

export default FilterBar;
