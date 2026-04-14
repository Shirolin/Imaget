import React, { useState, useCallback } from "react";
import {
  Stack,
  Group,
  Text,
  Divider,
  SimpleGrid,
  TextInput,
  ActionIcon,
  Box,
  NumberInput,
} from "@mantine/core";
import { IconAppWindow, IconBan, IconPlus, IconX } from "@tabler/icons-react";
import { t } from "../../../../core/utils/i18n";
import type { Settings } from "../../../../types";
import { SettingCard } from "../SettingCard";
import { SettingSwitch } from "../SettingSwitch";
import { PortalSelect } from "../../common/PortalSelect";

interface ExtractionSectionProps {
  settings: Settings["interfaceBehavior"];
  onUpdate: (updates: Partial<Settings["interfaceBehavior"]>) => void;
  portalNode: HTMLDivElement | null;
}

export const ExtractionSection: React.FC<ExtractionSectionProps> = ({
  settings,
  onUpdate,
  portalNode,
}) => {
  const [newDomain, setNewDomain] = useState("");

  const handleAddDomain = useCallback(() => {
    const domain = newDomain.trim().toLowerCase();
    if (!domain) return;

    if (settings.disabledDomains?.includes(domain)) {
      setNewDomain("");
      return;
    }

    onUpdate({
      disabledDomains: [...(settings.disabledDomains || []), domain],
    });
    setNewDomain("");
  }, [newDomain, settings.disabledDomains, onUpdate]);

  return (
    <Stack gap="md">
      <Stack gap="xs">
        <Group gap="xs">
          <Text fw={700} size="sm" c="dimmed" tt="uppercase">
            {t("secExtraction") || "Extraction"}
          </Text>
          <Divider style={{ flex: 1 }} opacity={0.5} />
        </Group>
      </Stack>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
        <SettingCard
          icon={<IconAppWindow />}
          title={t("secUiBehavior")}
          iconColor="var(--mantine-color-indigo-filled)"
        >
          <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="md">
            <SettingSwitch
              label={t("prefShowInSidebar")}
              description={t("prefShowInSidebarHint")}
              checked={settings.showInSidebar}
              onChange={(e) =>
                onUpdate({
                  showInSidebar: e.currentTarget.checked,
                })
              }
            />
            <SettingSwitch
              label={t("prefHideDownloadWarning")}
              checked={settings.hideDownloadWarning}
              onChange={(e) =>
                onUpdate({
                  hideDownloadWarning: e.currentTarget.checked,
                })
              }
            />
            <SettingSwitch
              label={t("prefSearchAllFrames")}
              checked={settings.searchAllFrames}
              onChange={(e) =>
                onUpdate({
                  searchAllFrames: e.currentTarget.checked,
                })
              }
            />
            <SettingSwitch
              label={t("prefIdentifyBackgroundImages")}
              checked={settings.identifyBackgroundImages}
              onChange={(e) =>
                onUpdate({
                  identifyBackgroundImages: e.currentTarget.checked,
                })
              }
            />
          </SimpleGrid>
          <Stack mt="md" gap="xs">
            <Group justify="space-between" wrap="nowrap">
              <Text size="sm" fw={500}>
                {t("prefShowHoverBtn")}
              </Text>
              <SettingSwitch
                checked={settings.showFloatingButton}
                onChange={(e) =>
                  onUpdate({
                    showFloatingButton: e.currentTarget.checked,
                  })
                }
              />
            </Group>
            <PortalSelect
              size="xs"
              label={t("prefMinImageSize")}
              portalNode={portalNode}
              value={
                [0, 32, 64, 128, 256].includes(settings.minImageSize)
                  ? settings.minImageSize.toString()
                  : "custom"
              }
              onChange={(val) => {
                let newSize = parseInt(val || "0");
                if (val === "custom") {
                  newSize = [0, 32, 64, 128, 256].includes(
                    settings.minImageSize,
                  )
                    ? settings.minImageSize + 1
                    : settings.minImageSize;
                }
                onUpdate({ minImageSize: newSize });
              }}
              data={[
                { label: t("sizeAlways"), value: "0" },
                { label: t("unitPixel", ["32"]), value: "32" },
                { label: t("unitPixel", ["64"]), value: "64" },
                { label: t("unitPixel", ["128"]), value: "128" },
                { label: t("unitPixel", ["256"]), value: "256" },
                { label: t("prefCustomSize"), value: "custom" },
              ]}
            />
            {![0, 32, 64, 128, 256].includes(settings.minImageSize) && (
              <NumberInput
                size="xs"
                placeholder={t("prefMinImageSize")}
                value={settings.minImageSize}
                onChange={(val) =>
                  onUpdate({
                    minImageSize: typeof val === "number" ? val : 0,
                  })
                }
                min={0}
                max={5000}
                allowNegative={false}
                suffix=" px"
              />
            )}
          </Stack>
        </SettingCard>

        <SettingCard
          icon={<IconBan />}
          title={t("secDisabledDomains")}
          iconColor="var(--mantine-color-red-filled)"
        >
          <Text size="xs" c="dimmed" mb="xs">
            {t("descDisabledDomains")}
          </Text>

          <TextInput
            placeholder="example.com"
            size="xs"
            value={newDomain}
            onChange={(e) => setNewDomain(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddDomain();
            }}
            rightSection={
              <ActionIcon
                size="sm"
                variant="subtle"
                color="blue"
                onClick={handleAddDomain}
                disabled={!newDomain.trim()}
                aria-label={t("btnAddDomain") || "Add Domain"}
              >
                <IconPlus size={14} />
              </ActionIcon>
            }
            mb="md"
          />

          {!settings.disabledDomains ||
          settings.disabledDomains.length === 0 ? (
            <Text size="sm" c="dimmed" fs="italic">
              {t("noDisabledDomains")}
            </Text>
          ) : (
            <Group gap="xs" wrap="wrap">
              {settings.disabledDomains.map((domain) => (
                <Box
                  key={domain}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "var(--mantine-color-dark-6)",
                    border: "1px solid var(--mantine-color-dark-4)",
                    borderRadius: "var(--mantine-radius-sm)",
                    padding: "2px 8px",
                  }}
                >
                  <Text size="xs" mr="xs">
                    {domain}
                  </Text>
                  <ActionIcon
                    size="xs"
                    variant="transparent"
                    color="red"
                    onClick={() => {
                      onUpdate({
                        disabledDomains:
                          settings.disabledDomains?.filter(
                            (d) => d !== domain,
                          ) || [],
                      });
                    }}
                    aria-label={t("btnRemoveDomain")}
                  >
                    <IconX size={12} stroke={3} />
                  </ActionIcon>
                </Box>
              ))}
            </Group>
          )}
        </SettingCard>
      </SimpleGrid>
    </Stack>
  );
};
