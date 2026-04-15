import React from "react";
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
  return (
    <Group grow gap="xs">
      <Autocomplete
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
      />
      <Autocomplete
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
      />
    </Group>
  );
};

export default SearchGroup;
