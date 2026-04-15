import React from "react";
import { Autocomplete, CloseButton, Group, Box } from "@mantine/core";
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
    <Group gap={0} wrap="nowrap">
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
        variant="unstyled"
        w={180}
        styles={{
          input: {
            height: "30px",
            minHeight: "30px",
            fontSize: "12px",
            paddingLeft: "30px",
          },
        }}
      />
      <Box w={1} h={16} bg="dark.4" opacity={0.3} mx={8} />
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
        variant="unstyled"
        w={140}
        styles={{
          input: {
            height: "30px",
            minHeight: "30px",
            fontSize: "12px",
            paddingLeft: "30px",
          },
        }}
      />
    </Group>
  );
};

export default SearchGroup;
