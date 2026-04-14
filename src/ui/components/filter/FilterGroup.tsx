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
    <>
      {/* Format MultiSelects */}
      <Group gap="xs" grow flex={1} wrap="wrap">
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
          miw={{ base: "100%", xs: 140 }}
          maxValues={2}
          styles={{
            input: {
              minHeight: "30px",
            },
            pill: { height: "20px", fontSize: "10px" },
          }}
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
          miw={{ base: "100%", xs: 140 }}
          maxValues={2}
          styles={{
            input: {
              minHeight: "30px",
            },
            pill: { height: "20px", fontSize: "10px" },
          }}
        />
      </Group>

      <Box w={1} h={20} bg="dark.4" opacity={0.5} mx={2} visibleFrom="xs" />

      {/* Resolution Inputs */}
      <Group
        gap={0}
        wrap="nowrap"
        style={{
          border: "1px solid var(--mantine-color-dark-4)",
          borderRadius: "var(--mantine-radius-sm)",
          overflow: "hidden",
        }}
      >
        <NumberInput
          aria-label={t("labelMinWidth")}
          value={minWidth}
          placeholder="W"
          onChange={(val) => onChange({ minWidth: Number(val) })}
          size="xs"
          w={55}
          variant="unstyled"
          styles={{
            input: {
              textAlign: "center",
              height: "30px",
              backgroundColor: "var(--mantine-color-dark-6)",
              fontSize: "11px",
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
            px={8}
            h={30}
            bg={resolutionMode === "or" ? "blue.9" : "teal.9"}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderLeft: "1px solid var(--mantine-color-dark-4)",
              borderRight: "1px solid var(--mantine-color-dark-4)",
              transition: "background-color 0.2s ease",
            }}
          >
            <Text
              size="10px"
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
          w={55}
          variant="unstyled"
          styles={{
            input: {
              textAlign: "center",
              height: "30px",
              backgroundColor: "var(--mantine-color-dark-6)",
              fontSize: "11px",
              fontWeight: 500,
            },
          }}
        />
      </Group>
    </>
  );
};

export default FilterGroup;
