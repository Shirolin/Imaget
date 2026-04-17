import React, { memo } from "react";
import {
  Stack,
  Group,
  Text,
  Divider,
  SimpleGrid,
  TextInput,
  NumberInput,
} from "@mantine/core";
import { IconFilter, IconFileCode } from "@tabler/icons-react";
import { t } from "../../../../core/utils/i18n";
import type { Settings, AspectRatioType, ImageFormat } from "../../../../types";
import { SettingCard } from "../SettingCard";
import { PortalSelect, PortalMultiSelect } from "../../common/PortalSelect";

interface FilterDefaultsSectionProps {
  settings: Settings["filterDefaults"];
  onUpdate: (updates: Partial<Settings["filterDefaults"]>) => void;
  portalNode: HTMLDivElement | null;
}

export const FilterDefaultsSection = memo(
  ({ settings, onUpdate, portalNode }: FilterDefaultsSectionProps) => {
    return (
      <Stack gap="md">
        <Stack gap="xs">
          <Group gap="xs">
            <Text fw={700} size="sm" c="dimmed" tt="uppercase">
              {t("secFilterDefaults") || "Filter Defaults"}
            </Text>
            <Divider style={{ flex: 1 }} opacity={0.5} />
          </Group>
          <Text size="xs" c="dimmed">
            {t("descFilterDefaults")}
          </Text>
        </Stack>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
          <SettingCard
            icon={<IconFilter />}
            title={t("secGeneral")}
            iconColor="var(--mantine-color-brand-filled)"
          >
            <Stack gap="md">
              <TextInput
                label={t("prefDefaultSearchQuery")}
                value={settings.searchQuery}
                onChange={(e) =>
                  onUpdate({
                    searchQuery: e.currentTarget.value,
                  })
                }
                size="xs"
              />
              <TextInput
                label={t("prefDefaultExcludeKeywords")}
                value={settings.excludeKeywords}
                onChange={(e) =>
                  onUpdate({
                    excludeKeywords: e.currentTarget.value,
                  })
                }
                size="xs"
              />
              <Group grow gap="xs">
                <NumberInput
                  label={t("prefDefaultMinWidth")}
                  value={settings.minWidth}
                  onChange={(val) =>
                    onUpdate({
                      minWidth: typeof val === "number" ? val : 0,
                    })
                  }
                  min={0}
                  max={9999}
                  suffix=" px"
                  allowNegative={false}
                  size="xs"
                />
                <NumberInput
                  label={t("prefDefaultMinHeight")}
                  value={settings.minHeight}
                  onChange={(val) =>
                    onUpdate({
                      minHeight: typeof val === "number" ? val : 0,
                    })
                  }
                  min={0}
                  max={9999}
                  suffix=" px"
                  allowNegative={false}
                  size="xs"
                />
              </Group>
              <Group grow gap="xs">
                <PortalSelect
                  label={t("prefDefaultResolutionMode")}
                  value={settings.resolutionMode}
                  portalNode={portalNode}
                  onChange={(val) =>
                    onUpdate({
                      resolutionMode: (val as "or" | "and") || "or",
                    })
                  }
                  data={[
                    { label: t("resModeOr"), value: "or" },
                    { label: t("resModeAnd"), value: "and" },
                  ]}
                  size="xs"
                />
                <PortalSelect
                  label={t("prefDefaultAspectRatio")}
                  value={settings.aspectRatio}
                  portalNode={portalNode}
                  onChange={(val) =>
                    onUpdate({
                      aspectRatio: (val as AspectRatioType) || "all",
                    })
                  }
                  data={[
                    { label: t("layoutAny"), value: "all" },
                    { label: t("layoutSquare"), value: "square" },
                    { label: t("layoutWide"), value: "landscape" },
                    { label: t("layoutTall"), value: "portrait" },
                  ]}
                  size="xs"
                />
              </Group>
            </Stack>
          </SettingCard>

          <SettingCard
            icon={<IconFileCode />}
            title={t("filterType")}
            iconColor="var(--mantine-color-teal-filled)"
          >
            <Stack gap="md">
              <PortalMultiSelect
                label={t("prefDefaultAllowedFormats")}
                value={settings.allowedFormats}
                portalNode={portalNode}
                onChange={(val) =>
                  onUpdate({
                    allowedFormats: val as ImageFormat[],
                  })
                }
                data={[
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
                ]}
                size="xs"
                clearable
              />
              <PortalMultiSelect
                label={t("prefDefaultExcludeFormats")}
                value={settings.excludeFormats}
                portalNode={portalNode}
                onChange={(val) =>
                  onUpdate({
                    excludeFormats: val as ImageFormat[],
                  })
                }
                data={[
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
                ]}
                size="xs"
                clearable
              />
            </Stack>
          </SettingCard>
        </SimpleGrid>
      </Stack>
    );
  },
);
