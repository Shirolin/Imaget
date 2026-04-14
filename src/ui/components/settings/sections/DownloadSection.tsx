import React, { memo } from "react";
import {
  Stack,
  Group,
  Text,
  Divider,
  SimpleGrid,
  Box,
  Slider,
  Radio,
} from "@mantine/core";
import {
  IconDownload,
  IconAdjustmentsHorizontal,
  IconFileCode,
} from "@tabler/icons-react";
import { t } from "../../../../core/utils/i18n";
import type { Settings } from "../../../../types";
import { SettingCard } from "../SettingCard";
import { SettingSwitch } from "../SettingSwitch";
import { PortalSelect } from "../../common/PortalSelect";

interface DownloadSectionProps {
  settings: Settings;
  onUpdateDownloadLogic: (updates: Partial<Settings["downloadLogic"]>) => void;
  onUpdateDownloadControl: (
    updates: Partial<Settings["downloadControl"]>,
  ) => void;
  onUpdateGifStrategy: (strategy: Settings["gifStrategy"]) => void;
  portalNode: HTMLDivElement | null;
}

export const DownloadSection = memo(({
  settings,
  onUpdateDownloadLogic,
  onUpdateDownloadControl,
  onUpdateGifStrategy,
  portalNode,
}: DownloadSectionProps) => {
  return (
    <Stack gap="md">
      <Stack gap="xs">
        <Group gap="xs">
          <Text fw={700} size="sm" c="dimmed" tt="uppercase">
            {t("secDownload") || "Download"}
          </Text>
          <Divider style={{ flex: 1 }} opacity={0.5} />
        </Group>
      </Stack>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
        <SettingCard
          icon={<IconDownload />}
          title={t("secDownloadLogic")}
          iconColor="var(--mantine-color-green-filled)"
        >
          <PortalSelect
            label={t("prefTargetFormat")}
            value={settings.downloadLogic.targetFormat}
            portalNode={portalNode}
            onChange={(val) =>
              onUpdateDownloadLogic({
                targetFormat:
                  (val as
                    | "original"
                    | "webp"
                    | "png"
                    | "jpg"
                    | "avif"
                    | "bmp") || "original",
              })
            }
            data={[
              { value: "original", label: t("formatOriginal") },
              { value: "webp", label: "WebP" },
              { value: "png", label: "PNG" },
              { value: "jpg", label: "JPG" },
              { value: "avif", label: "AVIF" },
              { value: "bmp", label: "BMP" },
            ]}
            styles={{
              input: { cursor: "pointer" },
              label: { cursor: "default" },
            }}
          />
          <Box>
            <Group justify="space-between" mb="xs">
              <Text size="sm">{t("prefQuality")}</Text>
              <Text size="xs" c="blue" fw={700}>
                {settings.downloadLogic.quality}%
              </Text>
            </Group>
            <Slider
              value={settings.downloadLogic.quality}
              onChange={(val) => onUpdateDownloadLogic({ quality: val })}
              label={(value) => `${value}%`}
              marks={[
                { value: 20, label: "20%" },
                { value: 50, label: "50%" },
                { value: 80, label: "80%" },
                { value: 100, label: "100%" },
              ]}
              mb={35}
              aria-label={t("labelImageQuality")}
              styles={{
                thumb: {
                  cursor: "grab",
                  "&:active": { cursor: "grabbing" },
                },
                track: { cursor: "pointer" },
                markLabel: { fontSize: "10px", marginTop: "4px" },
              }}
            />
          </Box>
          <SettingSwitch
            label={t("prefReEncodeWebp")}
            checked={settings.downloadLogic.reEncodeWebp}
            onChange={(e) =>
              onUpdateDownloadLogic({
                reEncodeWebp: e.currentTarget.checked,
              })
            }
          />
        </SettingCard>

        <SettingCard
          icon={<IconAdjustmentsHorizontal />}
          title={t("secDownloadControl")}
          iconColor="var(--mantine-color-blue-filled)"
        >
          <PortalSelect
            label={t("prefConflictResolution")}
            value={settings.downloadControl.conflictResolution}
            portalNode={portalNode}
            onChange={(val) =>
              onUpdateDownloadControl({
                conflictResolution:
                  (val as "uniquify" | "overwrite" | "prompt") || "uniquify",
              })
            }
            data={[
              { value: "uniquify", label: t("prefConflictUniquify") },
              { value: "overwrite", label: t("prefConflictOverwrite") },
              { value: "prompt", label: t("prefConflictPrompt") },
            ]}
            styles={{
              input: { cursor: "pointer" },
              label: { cursor: "default" },
            }}
          />
          <PortalSelect
            label={t("prefMaxConcurrency")}
            value={settings.downloadControl.maxConcurrency.toString()}
            portalNode={portalNode}
            onChange={(val) =>
              onUpdateDownloadControl({
                maxConcurrency: parseInt(val || "0"),
              })
            }
            data={[
              { value: "0", label: t("concurrencyUnlimited") },
              { value: "1", label: t("concurrencySingle") },
              { value: "3", label: t("concurrencyRecommended") },
              { value: "5", label: "5" },
              { value: "10", label: "10" },
            ]}
            styles={{
              input: { cursor: "pointer" },
              label: { cursor: "default" },
            }}
          />
        </SettingCard>
      </SimpleGrid>

      <SettingCard
        icon={<IconFileCode />}
        title={t("secGifHandling")}
        iconColor="var(--mantine-color-pink-filled)"
      >
        <Radio.Group
          value={settings.gifStrategy}
          onChange={(val) =>
            onUpdateGifStrategy(val as Settings["gifStrategy"])
          }
        >
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
            {(["keep", "firstFrame", "skip"] as const).map((strategy) => (
              <Box
                key={strategy}
                role="radio"
                aria-checked={settings.gifStrategy === strategy}
                tabIndex={0}
                onClick={() => onUpdateGifStrategy(strategy)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onUpdateGifStrategy(strategy);
                  }
                }}
                p="sm"
                style={{
                  borderRadius: "var(--mantine-radius-md)",
                  backgroundColor:
                    settings.gifStrategy === strategy
                      ? "var(--mantine-color-blue-light)"
                      : "transparent",
                  border: `1px solid ${
                    settings.gifStrategy === strategy
                      ? "var(--mantine-color-blue-filled)"
                      : "var(--mantine-color-dark-4)"
                  }`,
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <Radio
                  value={strategy}
                  tabIndex={-1}
                  label={
                    strategy === "keep"
                      ? t("gifOriginal")
                      : strategy === "firstFrame"
                        ? t("gifExtract")
                        : t("gifSkip")
                  }
                  styles={{
                    label: {
                      fontWeight: settings.gifStrategy === strategy ? 600 : 400,
                      cursor: "pointer",
                    },
                    radio: { cursor: "pointer" },
                  }}
                />
              </Box>
            ))}
          </SimpleGrid>
        </Radio.Group>
      </SettingCard>
    </Stack>
  );
});
