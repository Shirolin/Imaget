import React from "react";
import { Group, NumberInput, Tooltip, Button, Text, Box } from "@mantine/core";
import { IconPhoto, IconPhotoOff } from "@tabler/icons-react";
import { t } from "../../../core/utils/i18n";
import type { ImageFormat, FilterOptions } from "../../../types";
import { PortalMultiSelect } from "../common/PortalSelect";

interface FilterGroupProps {
  allowedFormats: ImageFormat[];
  excludeFormats: ImageFormat[];
  minWidth: number;
  minHeight: number;
  resolutionMode: "or" | "and";
  onChange: (updates: Partial<FilterOptions>) => void;
  portalNode: HTMLDivElement | null;
}

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
  "DPG",
];

export const FilterGroup: React.FC<FilterGroupProps> = ({
  allowedFormats,
  excludeFormats,
  minWidth,
  minHeight,
  resolutionMode,
  onChange,
  portalNode,
}) => {
  // 定义 Pill 的 Props 类型以通过 TS 检查
  interface FormatPillProps {
    value: string;
    onRemove: () => void;
  }

  // 智能 Pill 渲染逻辑：只显示第一个 + 计数
  const renderFormatPill = (
    values: ImageFormat[],
    { value }: FormatPillProps,
  ) => {
    if (values[0] !== value) return null;
    return (
      <Group gap={4} wrap="nowrap" align="center">
        <Text size="xs" fw={600} c="blue.4">
          {value}
        </Text>
        {values.length > 1 && (
          <Text size="10px" fw={800} c="dimmed">
            +{values.length - 1}
          </Text>
        )}
      </Group>
    );
  };

  // 共享的单行样式，防止 MultiSelect 撑高
  const multiSelectStyles = {
    input: {
      height: "30px",
      minHeight: "30px",
      paddingLeft: "30px",
      overflow: "hidden",
    },
    pillsList: {
      flexWrap: "nowrap" as const,
      maxHeight: "24px",
      overflow: "hidden",
    },
    pill: {
      height: "20px",
      maxWidth: "60px",
    },
  };

  return (
    <Group gap="xs" wrap="wrap" align="center">
      {/* Format MultiSelects Group */}
      <Group gap="xs" flex={{ base: "1 0 100%", sm: "1" }} wrap="nowrap">
        <PortalMultiSelect
          placeholder={t("filterType")}
          leftSection={
            <IconPhoto size={14} color="var(--mantine-color-dimmed)" />
          }
          data={formats}
          value={allowedFormats}
          onChange={(val) =>
            onChange({
              allowedFormats: val as ImageFormat[],
            })
          }
          clearable
          portalNode={portalNode}
          size="xs"
          variant="filled"
          w={{ base: "50%", sm: 180 }}
          flex={1}
          styles={multiSelectStyles}
          renderPill={(props: FormatPillProps) =>
            renderFormatPill(allowedFormats, props)
          }
        />

        <PortalMultiSelect
          placeholder={t("filterExcludeType")}
          leftSection={
            <IconPhotoOff size={14} color="var(--mantine-color-red-6)" />
          }
          data={formats}
          value={excludeFormats}
          onChange={(val) =>
            onChange({
              excludeFormats: val as ImageFormat[],
            })
          }
          clearable
          portalNode={portalNode}
          size="xs"
          variant="filled"
          w={{ base: "50%", sm: 180 }}
          flex={1}
          styles={multiSelectStyles}
          renderPill={(props: FormatPillProps) =>
            renderFormatPill(excludeFormats, props)
          }
        />
      </Group>

      <Box w={1} h={16} bg="dark.4" opacity={0.5} mx={2} visibleFrom="sm" />

      {/* Resolution Inputs */}
      <Group
        gap={4}
        wrap="nowrap"
        align="center"
        flex={{ base: "1 0 100%", sm: "none" }}
        justify="center"
        mt={{ base: 4, sm: 0 }}
      >
        <NumberInput
          aria-label={t("labelMinWidth")}
          value={minWidth}
          placeholder="W"
          onChange={(val) => onChange({ minWidth: Number(val) })}
          size="xs"
          w={60}
          min={0}
          max={9999}
          allowNegative={false}
          variant="filled"
          styles={{ input: { textAlign: "center", height: "30px" } }}
        />

        <Tooltip
          label={
            resolutionMode === "or" ? t("resModeOrDesc") : t("resModeAndDesc")
          }
          portalProps={{ target: portalNode || undefined }}
        >
          <Button
            onClick={() =>
              onChange({
                resolutionMode: resolutionMode === "or" ? "and" : "or",
              })
            }
            aria-label={
              resolutionMode === "or" ? t("resModeOr") : t("resModeAnd")
            }
            size="xs"
            variant="filled"
            color={resolutionMode === "or" ? "blue.9" : "teal.9"}
            px={6}
            h={30}
            styles={{
              root: {
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "var(--mantine-color-dark-4)",
              },
            }}
          >
            <Text size="10px" fw={900}>
              {resolutionMode.toUpperCase()}
            </Text>
          </Button>
        </Tooltip>

        <NumberInput
          placeholder="H"
          aria-label={t("labelMinHeight")}
          value={minHeight}
          onChange={(val) =>
            onChange({
              minHeight: Number(val),
            })
          }
          size="xs"
          w={60}
          min={0}
          max={9999}
          allowNegative={false}
          variant="filled"
          styles={{ input: { textAlign: "center", height: "30px" } }}
        />
      </Group>
    </Group>
  );
};

export default FilterGroup;
