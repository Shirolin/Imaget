import React, { memo } from "react";
import { Group, NumberInput, Tooltip, Button, Text } from "@mantine/core";
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

const FilterGroupBase: React.FC<FilterGroupProps> = ({
  allowedFormats,
  excludeFormats,
  minWidth,
  minHeight,
  resolutionMode,
  onChange,
  portalNode,
}) => {
  interface FormatPillProps {
    value: string;
    onRemove: () => void;
  }

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

  const inputStyles = {
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
    pill: { height: "20px", maxWidth: "60px" },
  };

  const sharedProps = {
    flex: { base: "1 0 100%", sm: 1 },
    miw: 0,
    size: "xs" as const,
    variant: "filled" as const,
    styles: inputStyles,
  };

  return (
    <>
      <PortalMultiSelect
        {...sharedProps}
        placeholder={t("filterType")}
        leftSection={
          <IconPhoto size={14} color="var(--mantine-color-dimmed)" />
        }
        data={formats}
        value={allowedFormats}
        onChange={(val) => onChange({ allowedFormats: val as ImageFormat[] })}
        clearable
        portalNode={portalNode}
        renderPill={(props: FormatPillProps) =>
          renderFormatPill(allowedFormats, props)
        }
      />

      <PortalMultiSelect
        {...sharedProps}
        placeholder={t("filterExcludeType")}
        leftSection={
          <IconPhotoOff size={14} color="var(--mantine-color-red-6)" />
        }
        data={formats}
        value={excludeFormats}
        onChange={(val) => onChange({ excludeFormats: val as ImageFormat[] })}
        clearable
        portalNode={portalNode}
        renderPill={(props: FormatPillProps) =>
          renderFormatPill(excludeFormats, props)
        }
      />

      {/* 这里的 Resolution Inputs 将在 FilterBar 中被显式移动或包裹 */}
      <Group
        gap={4}
        wrap="nowrap"
        align="center"
        px={8}
        py={2}
        bg="dark.9"
        style={{
          borderRadius: "var(--mantine-radius-md)",
          border: "1px solid var(--mantine-color-dark-4)",
        }}
      >
        <NumberInput
          aria-label={t("labelMinWidth")}
          value={minWidth}
          placeholder="W"
          onChange={(val) => onChange({ minWidth: Number(val) })}
          size="xs"
          w={50}
          min={0}
          max={9999}
          allowNegative={false}
          variant="unstyled"
          styles={{ input: { textAlign: "center", height: "24px" } }}
        />
        <Tooltip
          label={`${
            resolutionMode === "or" ? t("resModeOr") : t("resModeAnd")
          }: ${
            resolutionMode === "or" ? t("resModeOrDesc") : t("resModeAndDesc")
          }`}
          portalProps={{ target: portalNode || undefined }}
        >
          <Button
            onClick={() =>
              onChange({
                resolutionMode: resolutionMode === "or" ? "and" : "or",
              })
            }
            aria-label={`${t("resModeOr")}/${t("resModeAnd")}`}
            size="xs"
            variant="filled"
            color={resolutionMode === "or" ? "blue.9" : "teal.9"}
            px={4}
            h={18}
          >
            <Text size="9px" fw={900}>
              {resolutionMode.toUpperCase()}
            </Text>
          </Button>
        </Tooltip>
        <NumberInput
          placeholder="H"
          aria-label={t("labelMinHeight")}
          value={minHeight}
          onChange={(val) => onChange({ minHeight: Number(val) })}
          size="xs"
          w={50}
          min={0}
          max={9999}
          allowNegative={false}
          variant="unstyled"
          styles={{ input: { textAlign: "center", height: "24px" } }}
        />
      </Group>
    </>
  );
};

export const FilterGroup = memo(FilterGroupBase);
export default FilterGroup;
