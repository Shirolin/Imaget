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
    if (values[0] !== value) return null;
    return (
      <Text size="xs" fw={500} c="blue.4" style={{ whiteSpace: "nowrap" }}>
        {values.length > 1 ? `${label}: ${values.length}` : value}
      </Text>
    );
  };

  return (
    <Group
      gap={4}
      p={6}
      bg="dark.9"
      style={{ borderRadius: "var(--mantine-radius-md)" }}
      wrap="nowrap"
    >
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
        w={{ base: "100%", xs: 130 }}
        miw={100}
        renderPill={(props: FormatPillProps) =>
          renderFormatPill(t("filterType"), allowedFormats, props)
        }
        styles={{
          input: {
            height: "30px",
            minHeight: "30px",
            backgroundColor: "transparent",
            border: 0,
            paddingRight: "24px",
          },
        }}
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
        w={{ base: "100%", xs: 130 }}
        miw={100}
        renderPill={(props: FormatPillProps) =>
          renderFormatPill(t("filterExcludeType"), excludeFormats, props)
        }
        styles={{
          input: {
            height: "30px",
            minHeight: "30px",
            backgroundColor: "transparent",
            border: 0,
            paddingRight: "24px",
          },
        }}
      />

      <Box w={1} h={20} bg="dark.4" opacity={0.3} mx={2} visibleFrom="xs" />

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
              backgroundColor: "transparent",
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
            h={22}
            bg={resolutionMode === "or" ? "blue.9" : "teal.9"}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "4px",
              transition: "background-color 0.2s ease",
            }}
          >
            <Text
              size="9px"
              fw={800}
              c="white"
              style={{ letterSpacing: "0.5px" }}
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
              backgroundColor: "transparent",
              fontSize: "12px",
              fontWeight: 500,
            },
          }}
        />
      </Group>
    </Group>
  );
};

export default FilterGroup;
