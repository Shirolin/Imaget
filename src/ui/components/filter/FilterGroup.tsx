import React from "react";
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

export const FilterGroup: React.FC<FilterGroupProps> = ({
  allowedFormats,
  excludeFormats,
  minWidth,
  minHeight,
  resolutionMode,
  onChange,
  portalNode,
}) => {
  return (
    <Group gap="xs" wrap="nowrap">
      {/* Format MultiSelects */}
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
        w={150}
      />

      <PortalMultiSelect
        placeholder={t("filterExcludeType")}
        leftSection={
          <IconPhotoOff size={14} color="var(--mantine-color-dimmed)" />
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
        w={150}
      />

      {/* Resolution Inputs */}
      <Group gap="xs" wrap="nowrap">
        <NumberInput
          aria-label={t("labelMinWidth")}
          value={minWidth}
          placeholder="W"
          onChange={(val) => onChange({ minWidth: Number(val) })}
          size="xs"
          w={70}
          variant="filled"
        />

        <Tooltip
          label={
            resolutionMode === "or" ? t("resModeOrDesc") : t("resModeAndDesc")
          }
          portalProps={{ target: portalNode || undefined }}
          withArrow
          withinPortal
        >
          <Button
            onClick={() =>
              onChange({
                resolutionMode: resolutionMode === "or" ? "and" : "or",
              })
            }
            size="xs"
            variant="filled"
            color={resolutionMode === "or" ? "blue" : "teal"}
            px="xs"
          >
            {resolutionMode === "or"
              ? t("resModeOr").toUpperCase()
              : t("resModeAnd").toUpperCase()}
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
          w={70}
          variant="filled"
        />
        <Text size="xs" c="dimmed" fw={500}>
          px
        </Text>
      </Group>
    </Group>
  );
};

export default FilterGroup;
