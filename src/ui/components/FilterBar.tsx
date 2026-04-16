import React from "react";
import { Group, Stack } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import type { FilterOptions } from "../../types";
import SearchGroup from "./filter/SearchGroup";
import TypeFilterGroup from "./filter/TypeFilterGroup";
import ResolutionGroup from "./filter/ResolutionGroup";
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
      gap="md"
      p="md"
      bg="dark.8"
      style={{
        borderBottom: "1px solid var(--mantine-color-dark-4)",
        zIndex: 10,
      }}
    >
      {/* Row 1: Search and Type Filters (4 inputs stretching evenly) */}
      <Group gap="xs" wrap="wrap">
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
        <TypeFilterGroup
          allowedFormats={options.allowedFormats}
          excludeFormats={options.excludeFormats}
          onChange={handleUpdate}
          portalNode={portalNode}
        />
      </Group>

      {/* Row 2: Resolution and Sort/Layout */}
      <Group justify="space-between" align="center">
        <ResolutionGroup
          minWidth={options.minWidth}
          minHeight={options.minHeight}
          resolutionMode={options.resolutionMode}
          onChange={handleUpdate}
          portalNode={portalNode}
        />
        <SortLayoutGroup
          aspectRatio={options.aspectRatio}
          sortBy={options.sortBy}
          sortDirection={options.sortDirection}
          layout={options.layout}
          onChange={handleUpdate}
          portalNode={portalNode}
        />
      </Group>
    </Stack>
  );
};

export default FilterBar;
