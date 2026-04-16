import React, { useRef } from "react";
import { Autocomplete, CloseButton, Group } from "@mantine/core";
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

const SearchGroup: React.FC<SearchGroupProps> = ({
  searchQuery,
  onSearchChange,
  excludeKeywords,
  onExcludeKeywordsChange,
  onClearSearch,
  onClearExclude,
}) => {
  const searchRef = useRef<HTMLInputElement>(null);
  const excludeRef = useRef<HTMLInputElement>(null);

  return (
    <Group gap="xs" wrap="wrap" flex={1}>
      <Autocomplete
        ref={searchRef}
        placeholder={t("filterSearch")}
        leftSection={
          <IconSearch size={14} color="var(--mantine-color-dimmed)" />
        }
        data={[
          "avatar",
          "background",
          "banner",
          "icon",
          "logo",
          "wallpaper",
          "photo",
          "header",
          "footer",
          "thumbnail",
          "cover",
        ]}
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
        size="xs"
        variant="filled"
        w={{ base: "100%", sm: 180 }}
        flex={1}
      />
      <Autocomplete
        ref={excludeRef}
        placeholder={t("filterExclude")}
        leftSection={
          <IconSearchOff size={14} color="var(--mantine-color-dimmed)" />
        }
        data={[
          "ads",
          "pixel",
          "spacer",
          "tracking",
          "spinner",
          "loader",
          "dot",
          "line",
          "blank",
          "empty",
        ]}
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
        size="xs"
        variant="filled"
        w={{ base: "100%", sm: 140 }}
        flex={1}
      />
    </Group>
  );
};

export default SearchGroup;
