import React, { useRef, memo } from "react";
import { Autocomplete, CloseButton } from "@mantine/core";
import { IconSearch, IconSearchOff } from "@tabler/icons-react";
import { t } from "../../../core/utils/i18n";

interface SearchGroupProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  excludeKeywords: string;
  onExcludeKeywordsChange: (value: string) => void;
  onClearSearch: () => void;
  onClearExclude: () => void;
}

const SearchGroupBase: React.FC<SearchGroupProps> = ({
  searchQuery,
  onSearchChange,
  excludeKeywords,
  onExcludeKeywordsChange,
  onClearSearch,
  onClearExclude,
}) => {
  const searchRef = useRef<HTMLInputElement>(null);
  const excludeRef = useRef<HTMLInputElement>(null);

  // 统一的响应式宽度和 flex 表现
  const inputProps = {
    flex: { base: "1 0 100%", sm: 1 },
    miw: 0, // 强制允许收缩，防止溢出
    size: "xs" as const,
    variant: "filled" as const,
  };

  return (
    <>
      <Autocomplete
        {...inputProps}
        ref={searchRef}
        placeholder={t("filterSearch")}
        leftSection={
          <IconSearch size={14} color="var(--mantine-color-dimmed)" />
        }
        data={["avatar", "background", "banner", "logo", "wallpaper"]}
        value={searchQuery}
        onChange={onSearchChange}
        onOptionSubmit={() => searchRef.current?.focus()}
        rightSectionPointerEvents="all"
        rightSection={
          <CloseButton
            aria-label={t("labelClearSearch")}
            onClick={onClearSearch}
            style={{ display: searchQuery ? undefined : "none" }}
            size="sm"
          />
        }
      />
      <Autocomplete
        {...inputProps}
        ref={excludeRef}
        placeholder={t("filterExclude")}
        leftSection={
          <IconSearchOff size={14} color="var(--mantine-color-red-6)" />
        }
        data={["ads", "pixel", "spacer", "tracking", "spinner"]}
        value={excludeKeywords}
        onChange={onExcludeKeywordsChange}
        onOptionSubmit={() => excludeRef.current?.focus()}
        rightSectionPointerEvents="all"
        rightSection={
          <CloseButton
            aria-label={t("labelClearExclude")}
            onClick={onClearExclude}
            style={{ display: excludeKeywords ? undefined : "none" }}
            size="sm"
          />
        }
      />
    </>
  );
};

export const SearchGroup = memo(SearchGroupBase);
export default SearchGroup;
