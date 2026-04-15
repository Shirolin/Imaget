import React from "react";
import {
  Group,
  NumberInput,
  Tooltip,
  UnstyledButton,
  Text,
  Box,
} from "@mantine/core";
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

interface FormatPillProps {
  value: string;
  onRemove: () => void;
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
  const renderFormatPill = (
    label: string,
    values: ImageFormat[],
    { value }: FormatPillProps,
  ) => {
    // Only show the first item as a summary if multiple items are selected
    if (values[0] !== value) return null;
    return (
      <Text size="xs" fw={500} c="blue.4" style={{ whiteSpace: "nowrap" }}>
        {values.length > 2 ? `${label}: ${values.length}` : values.join(", ")}
      </Text>
    );
  };

  return (
    <Group gap={0} wrap="nowrap">
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
        variant="unstyled"
        miw={120}
        maw={200}
        renderPill={(props: FormatPillProps) =>
          renderFormatPill(t("filterType"), allowedFormats, props)
        }
        styles={{
          input: {
            height: "30px",
            minHeight: "30px",
            paddingRight: "24px",
            paddingLeft: "30px",
            display: "flex",
            alignItems: "center",
          },
        }}
      />

      <Box w={1} h={16} bg="dark.4" opacity={0.3} mx={8} />

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
        variant="unstyled"
        miw={120}
        maw={200}
        renderPill={(props: FormatPillProps) =>
          renderFormatPill(t("filterExcludeType"), excludeFormats, props)
        }
        styles={{
          input: {
            height: "30px",
            minHeight: "30px",
            paddingRight: "24px",
            paddingLeft: "30px",
            display: "flex",
            alignItems: "center",
          },
        }}
      />

      <Box w={1} h={16} bg="dark.4" opacity={0.3} mx={12} />

      {/* Resolution Inputs */}
      <Group gap={0} wrap="nowrap">
        <NumberInput
          aria-label={t("labelMinWidth")}
          value={minWidth}
          placeholder="W"
          onChange={(val) => onChange({ minWidth: Number(val) })}
          size="xs"
          w={45}
          variant="unstyled"
          styles={{
            input: {
              textAlign: "center",
              height: "30px",
              fontSize: "12px",
              fontWeight: 500,
            },
          }}
        />

        <Tooltip
          label={
            resolutionMode === "or" ? t("resModeOrDesc") : t("resModeAndDesc")
          }
          portalProps={{ target: portalNode || undefined }}
          withArrow
          withinPortal
        >
          <UnstyledButton
            onClick={() =>
              onChange({
                resolutionMode: resolutionMode === "or" ? "and" : "or",
              })
            }
            px={4}
            h={16}
            bg="dark.6"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "4px",
              border: "1px solid var(--mantine-color-dark-4)",
              transition: "all 0.2s ease",
            }}
          >
            <Text
              size="9px"
              fw={800}
              c={resolutionMode === "or" ? "blue.4" : "teal.4"}
              style={{ lineHeight: 1 }}
            >
              {resolutionMode === "or"
                ? t("resModeOr").toUpperCase()
                : t("resModeAnd").toUpperCase()}
            </Text>
          </UnstyledButton>
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
          w={45}
          variant="unstyled"
          styles={{
            input: {
              textAlign: "center",
              height: "30px",
              fontSize: "12px",
              fontWeight: 500,
            },
          }}
        />
        <Text size="xs" c="dimmed" fw={500} ml={2}>
          px
        </Text>
      </Group>
    </Group>
  );
};

export default FilterGroup;
