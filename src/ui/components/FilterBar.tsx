import React from "react";
import { Group, Box } from "@mantine/core";
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
    <Box p="sm" style={{ zIndex: 10 }}>
      <Group
        px="md"
        py={4}
        gap={0}
        bg="dark.9"
        align="center"
        justify="flex-start"
        wrap="nowrap"
        style={{
          borderRadius: "var(--mantine-radius-xl)",
          border: "1px solid var(--mantine-color-dark-4)",
          boxShadow: "var(--mantine-shadow-lg)",
          minHeight: "40px",
          width: "fit-content",
          maxWidth: "100%",
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
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

        <Box w={1} h={20} bg="dark.4" opacity={0.3} mx="md" visibleFrom="md" />

        <FilterGroup
          allowedFormats={options.allowedFormats}
          excludeFormats={options.excludeFormats}
          minWidth={options.minWidth}
          minHeight={options.minHeight}
          resolutionMode={options.resolutionMode}
          onChange={handleUpdate}
          portalNode={portalNode}
        />

        <Box w={1} h={20} bg="dark.4" opacity={0.3} mx="md" visibleFrom="md" />

        <SortLayoutGroup
          aspectRatio={options.aspectRatio}
          sortBy={options.sortBy}
          sortDirection={options.sortDirection}
          layout={options.layout}
          onChange={handleUpdate}
          portalNode={portalNode}
        />
      </Group>
    </Box>
  );
};

export default FilterBar;
