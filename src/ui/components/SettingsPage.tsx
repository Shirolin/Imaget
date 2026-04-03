import React from "react";
import {
  Stack,
  Group,
  Title,
  Text,
  TextInput,
  Slider,
  NumberInput,
  Button,
  Box,
  SimpleGrid,
  SegmentedControl,
  ActionIcon,
  Tooltip,
  UnstyledButton,
  ScrollArea,
} from "@mantine/core";
import { t } from "../../core/utils/i18n";
import {
  IconDownload,
  IconSettings,
  IconAppWindow,
  IconAdjustmentsHorizontal,
  IconLanguage,
  IconFileCode,
  IconFolder,
  IconVariable,
  IconRestore,
  IconBrandGithub,
  IconCoffee,
  IconHeart,
  IconBug,
  IconBan,
} from "@tabler/icons-react";
import { Settings } from "../../types";
import { PortalSelect } from "./common/PortalSelect";
import { SettingCard } from "./settings/SettingCard";
import { SettingSwitch } from "./settings/SettingSwitch";

interface SettingsPageProps {
  settings: Settings;
  onUpdate: (
    newSettings: Partial<Settings> | ((prev: Settings) => Settings),
  ) => void;
  onReset: () => void;
  portalNode: HTMLDivElement | null;
}

const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdate,
  onReset,
  portalNode,
}) => {
  return (
    <ScrollArea
      h="100%"
      offsetScrollbars
      scrollbarSize={8}
      styles={{
        viewport: { paddingRight: "var(--mantine-spacing-md)" },
        thumb: {
          backgroundColor: "var(--mantine-color-dark-4)",
          opacity: 0.5,
          "&:hover": {
            backgroundColor: "var(--mantine-color-dark-3)",
            opacity: 0.8,
          },
        },
      }}
    >
      <Stack gap="xl" p="xl">
        <Group justify="space-between">
          <Stack gap={0}>
            <Group gap="xs">
              <IconSettings
                size={22}
                style={{ color: "var(--mantine-color-blue-filled)" }}
              />
              <Title order={3}>{t("tabPreferences")}</Title>
            </Group>
            {!(
              typeof chrome !== "undefined" &&
              chrome.runtime &&
              chrome.runtime.id
            ) ? (
              <Text size="xs" c="orange" mt={4} fw={500}>
                {t("warningWebEnvironment")}
              </Text>
            ) : (
              <Text size="xs" c="dimmed" mt={4}>
                {t("infoExtensionEnvironment")}
              </Text>
            )}
          </Stack>
          <Button
            variant="subtle"
            color="red"
            leftSection={<IconRestore size={16} />}
            onClick={onReset}
            size="xs"
          >
            {t("resetAllSettings")}
          </Button>
        </Group>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          <Stack gap="lg">
            <SettingCard
              icon={<IconLanguage />}
              title={t("secLanguage")}
              iconColor="var(--mantine-color-cyan-filled)"
            >
              <PortalSelect
                label={t("prefLanguage")}
                placeholder={t("selectPlaceholder")}
                value={settings.general.language}
                portalNode={portalNode}
                onChange={(val) =>
                  onUpdate((prev) => ({
                    ...prev,
                    general: {
                      ...prev.general,
                      language:
                        (val as Settings["general"]["language"]) || "auto",
                    },
                  }))
                }
                data={[
                  { value: "auto", label: t("langAuto") },
                  { value: "en", label: "English" },
                  { value: "zh_CN", label: "中文 (中国)" },
                  { value: "zh_TW", label: "中文 (台灣)" },
                  { value: "ja", label: "日本語" },
                  { value: "ko", label: "한국어" },
                  { value: "de", label: "Deutsch" },
                  { value: "fr", label: "Français" },
                  { value: "es", label: "Español" },
                  { value: "pt_BR", label: "Português (Brasil)" },
                  { value: "tr", label: "Türkçe" },
                ]}
                styles={{
                  input: { cursor: "pointer" },
                  label: { cursor: "default" },
                }}
              />
            </SettingCard>

            <SettingCard
              icon={<IconFolder />}
              title={t("secFileSave")}
              iconColor="var(--mantine-color-orange-filled)"
            >
              <TextInput
                label={t("prefSubfolder")}
                description={t("prefSubfolderHint")}
                value={settings.fileSaving.subfolder}
                styles={{ input: { cursor: "text" } }}
                onChange={(e) =>
                  onUpdate((prev) => ({
                    ...prev,
                    fileSaving: {
                      ...prev.fileSaving,
                      subfolder: e.currentTarget.value,
                    },
                  }))
                }
                placeholder={t("prefSubfolderPlaceholder")}
              />
              <TextInput
                label={t("prefFilename")}
                value={settings.fileSaving.filenameTemplate}
                styles={{ input: { cursor: "text" } }}
                onChange={(e) =>
                  onUpdate((prev) => ({
                    ...prev,
                    fileSaving: {
                      ...prev.fileSaving,
                      filenameTemplate: e.currentTarget.value,
                    },
                  }))
                }
                rightSection={
                  <Tooltip
                    label={t("viewVariables")}
                    portalProps={{ target: portalNode || undefined }}
                  >
                    <ActionIcon variant="transparent" color="gray">
                      <IconVariable size={16} />
                    </ActionIcon>
                  </Tooltip>
                }
              />
              <Group gap="xs">
                <Button
                  variant="default"
                  size="compact-xs"
                  radius="xl"
                  onClick={() =>
                    onUpdate((prev) => ({
                      ...prev,
                      fileSaving: {
                        ...prev.fileSaving,
                        filenameTemplate: "{page_title}_{date}_{time}_{index}",
                      },
                    }))
                  }
                >
                  {t("resetDefault")}
                </Button>
                <Button
                  variant="default"
                  size="compact-xs"
                  radius="xl"
                  onClick={() =>
                    onUpdate((prev) => ({
                      ...prev,
                      fileSaving: {
                        ...prev.fileSaving,
                        filenameTemplate: "{origin}",
                      },
                    }))
                  }
                >
                  {t("useOriginal")}
                </Button>
                <Button
                  variant="default"
                  size="compact-xs"
                  radius="xl"
                  onClick={() =>
                    onUpdate((prev) => ({
                      ...prev,
                      fileSaving: {
                        ...prev.fileSaving,
                        filenameTemplate: "{index}_{origin}",
                      },
                    }))
                  }
                >
                  {t("presetIndexOriginal")}
                </Button>
              </Group>
              <Box
                bg="var(--mantine-color-dark-6)"
                p="xs"
                style={{
                  borderRadius: "var(--mantine-radius-md)",
                  border: "1px dashed var(--mantine-color-dark-4)",
                }}
              >
                <Text size="xs" c="dimmed" style={{ fontFamily: "monospace" }}>
                  {t("viewVariables")}:{" "}
                  {
                    "{date}, {time}, {title}, {id}, {index}, {page_title}, {origin}"
                  }
                </Text>
              </Box>
            </SettingCard>

            <SettingCard
              icon={<IconAppWindow />}
              title={t("secUiBehavior")}
              iconColor="var(--mantine-color-indigo-filled)"
            >
              <SimpleGrid cols={{ base: 1, xs: 2, sm: 1, lg: 2 }} spacing="lg">
                <SettingSwitch
                  label={t("prefShowInSidebar")}
                  checked={settings.interfaceBehavior.showInSidebar}
                  onChange={(e) =>
                    onUpdate((prev) => ({
                      ...prev,
                      interfaceBehavior: {
                        ...prev.interfaceBehavior,
                        showInSidebar: e.currentTarget.checked,
                      },
                    }))
                  }
                />
                <SettingSwitch
                  label={t("prefHideDownloadWarning")}
                  checked={settings.interfaceBehavior.hideDownloadWarning}
                  onChange={(e) =>
                    onUpdate((prev) => ({
                      ...prev,
                      interfaceBehavior: {
                        ...prev.interfaceBehavior,
                        hideDownloadWarning: e.currentTarget.checked,
                      },
                    }))
                  }
                />
                <SettingSwitch
                  label={t("prefSearchAllFrames")}
                  checked={settings.interfaceBehavior.searchAllFrames}
                  onChange={(e) =>
                    onUpdate((prev) => ({
                      ...prev,
                      interfaceBehavior: {
                        ...prev.interfaceBehavior,
                        searchAllFrames: e.currentTarget.checked,
                      },
                    }))
                  }
                />
                <SettingSwitch
                  label={t("prefIdentifyBackgroundImages")}
                  checked={settings.interfaceBehavior.identifyBackgroundImages}
                  onChange={(e) =>
                    onUpdate((prev) => ({
                      ...prev,
                      interfaceBehavior: {
                        ...prev.interfaceBehavior,
                        identifyBackgroundImages: e.currentTarget.checked,
                      },
                    }))
                  }
                />
                <SettingSwitch
                  label={t("prefIdentifyBlobImages")}
                  checked={settings.interfaceBehavior.identifyBlobImages}
                  onChange={(e) =>
                    onUpdate((prev) => ({
                      ...prev,
                      interfaceBehavior: {
                        ...prev.interfaceBehavior,
                        identifyBlobImages: e.currentTarget.checked,
                      },
                    }))
                  }
                />
              </SimpleGrid>
              <Stack mt="md" gap="xs">
                <Group justify="space-between" wrap="nowrap">
                  <Text size="sm" fw={500}>
                    {t("prefShowHoverBtn")}
                  </Text>
                  <SettingSwitch
                    checked={settings.interfaceBehavior.showFloatingButton}
                    onChange={(e) =>
                      onUpdate((prev) => ({
                        ...prev,
                        interfaceBehavior: {
                          ...prev.interfaceBehavior,
                          showFloatingButton: e.currentTarget.checked,
                        },
                      }))
                    }
                  />
                </Group>
                <Text size="xs" c="dimmed">
                  {t("prefMinImageSize")}
                </Text>
                <SegmentedControl
                  size="xs"
                  style={{ cursor: "pointer" }}
                  value={
                    [0, 32, 64, 128, 256].includes(
                      settings.interfaceBehavior.minImageSize,
                    )
                      ? settings.interfaceBehavior.minImageSize.toString()
                      : "custom"
                  }
                  onChange={(val) =>
                    onUpdate((prev) => {
                      let newSize = parseInt(val);
                      if (val === "custom") {
                        newSize = [0, 32, 64, 128, 256].includes(
                          prev.interfaceBehavior.minImageSize,
                        )
                          ? prev.interfaceBehavior.minImageSize + 1
                          : prev.interfaceBehavior.minImageSize;
                      }
                      return {
                        ...prev,
                        interfaceBehavior: {
                          ...prev.interfaceBehavior,
                          minImageSize: newSize,
                        },
                      };
                    })
                  }
                  aria-label={t("prefMinImageSize")}
                  data={[
                    { label: t("sizeAlways"), value: "0" },
                    { label: t("unitPixel", ["32"]), value: "32" },
                    { label: t("unitPixel", ["64"]), value: "64" },
                    { label: t("unitPixel", ["128"]), value: "128" },
                    { label: t("unitPixel", ["256"]), value: "256" },
                    { label: t("prefCustomSize"), value: "custom" },
                  ]}
                />
                {![0, 32, 64, 128, 256].includes(
                  settings.interfaceBehavior.minImageSize,
                ) && (
                  <NumberInput
                    size="xs"
                    placeholder={t("prefMinImageSize")}
                    value={settings.interfaceBehavior.minImageSize}
                    onChange={(val) =>
                      onUpdate((prev) => ({
                        ...prev,
                        interfaceBehavior: {
                          ...prev.interfaceBehavior,
                          minImageSize: typeof val === "number" ? val : 0,
                        },
                      }))
                    }
                    min={0}
                    max={5000}
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
              <Text size="xs" c="dimmed" mb="md">
                {t("descDisabledDomains")}
              </Text>

              {!settings.interfaceBehavior.disabledDomains ||
              settings.interfaceBehavior.disabledDomains.length === 0 ? (
                <Text size="sm" c="dimmed" fs="italic">
                  {t("noDisabledDomains")}
                </Text>
              ) : (
                <Group gap="xs">
                  {settings.interfaceBehavior.disabledDomains.map((domain) => (
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
                          onUpdate((prev) => ({
                            ...prev,
                            interfaceBehavior: {
                              ...prev.interfaceBehavior,
                              disabledDomains:
                                prev.interfaceBehavior.disabledDomains?.filter(
                                  (d) => d !== domain,
                                ) || [],
                            },
                          }));
                        }}
                        aria-label={t("btnRemoveDomain")}
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </ActionIcon>
                    </Box>
                  ))}
                </Group>
              )}
            </SettingCard>
          </Stack>

          <Stack gap="lg">
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
                  onUpdate((prev) => ({
                    ...prev,
                    downloadLogic: {
                      ...prev.downloadLogic,
                      targetFormat:
                        (val as "original" | "webp" | "png" | "jpg") ||
                        "original",
                    },
                  }))
                }
                data={[
                  { value: "original", label: t("formatOriginal") },
                  { value: "webp", label: "WebP" },
                  { value: "png", label: "PNG" },
                  { value: "jpg", label: "JPG" },
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
                  onChange={(val) =>
                    onUpdate((prev) => ({
                      ...prev,
                      downloadLogic: { ...prev.downloadLogic, quality: val },
                    }))
                  }
                  label={null}
                  mb="sm"
                  aria-label={t("labelImageQuality")}
                  styles={{
                    thumb: {
                      cursor: "grab",
                      "&:active": { cursor: "grabbing" },
                    },
                    track: { cursor: "pointer" },
                  }}
                />
              </Box>
              <SettingSwitch
                label={t("prefReEncodeWebp")}
                checked={settings.downloadLogic.reEncodeWebp}
                onChange={(e) =>
                  onUpdate((prev) => ({
                    ...prev,
                    downloadLogic: {
                      ...prev.downloadLogic,
                      reEncodeWebp: e.currentTarget.checked,
                    },
                  }))
                }
              />
            </SettingCard>

            <SettingCard
              icon={<IconFileCode />}
              title={t("secGifHandling")}
              iconColor="var(--mantine-color-pink-filled)"
            >
              <Stack gap="xs">
                {(["keep", "firstFrame", "skip"] as const).map((strategy) => (
                  <UnstyledButton
                    key={strategy}
                    onClick={() =>
                      onUpdate((prev) => ({ ...prev, gifStrategy: strategy }))
                    }
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
                      width: "100%",
                      cursor: "pointer",
                    }}
                  >
                    <Group gap="xs">
                      <Box
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          border: "2px solid var(--mantine-color-blue-filled)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {settings.gifStrategy === strategy && (
                          <Box
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              background: "var(--mantine-color-blue-filled)",
                            }}
                          />
                        )}
                      </Box>
                      <Text
                        size="sm"
                        fw={settings.gifStrategy === strategy ? 600 : 400}
                      >
                        {strategy === "keep"
                          ? t("gifOriginal")
                          : strategy === "firstFrame"
                            ? t("gifExtract")
                            : t("gifSkip")}
                      </Text>
                    </Group>
                  </UnstyledButton>
                ))}
              </Stack>
            </SettingCard>

            <SettingCard
              icon={<IconAdjustmentsHorizontal />}
              title={t("secDownloadControl")}
              iconColor="var(--mantine-color-blue-filled)"
            >
              <SimpleGrid cols={{ base: 1, xs: 2, sm: 1, lg: 2 }} spacing="lg">
                <PortalSelect
                  label={t("prefConflictResolution")}
                  value={settings.downloadControl.conflictResolution}
                  portalNode={portalNode}
                  onChange={(val) =>
                    onUpdate((prev) => ({
                      ...prev,
                      downloadControl: {
                        ...prev.downloadControl,
                        conflictResolution:
                          (val as "uniquify" | "overwrite" | "prompt") ||
                          "uniquify",
                      },
                    }))
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
                    onUpdate((prev) => ({
                      ...prev,
                      downloadControl: {
                        ...prev.downloadControl,
                        maxConcurrency: parseInt(val || "0"),
                      },
                    }))
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
              </SimpleGrid>
            </SettingCard>
            <SettingCard
              icon={<IconHeart />}
              title={t("secSupport")}
              iconColor="var(--mantine-color-orange-filled)"
            >
              <Stack gap="xs">
                <Button
                  component="a"
                  href="https://github.com/Shirolin/Imaget"
                  target="_blank"
                  variant="light"
                  color="gray"
                  leftSection={<IconBrandGithub size={16} />}
                  justify="flex-start"
                  fullWidth
                >
                  {t("labelGithub")}
                </Button>
                <Group grow gap="xs">
                  <Button
                    component="a"
                    href="https://ifdian.net/a/shirolin"
                    target="_blank"
                    variant="light"
                    color="blue"
                    leftSection={<IconCoffee size={16} />}
                    justify="flex-start"
                  >
                    {t("labelAfdian")}
                  </Button>
                  <Button
                    component="a"
                    href="https://ko-fi.com/shirolin"
                    target="_blank"
                    variant="light"
                    color="pink"
                    leftSection={<IconHeart size={16} />}
                    justify="flex-start"
                  >
                    {t("labelKofi")}
                  </Button>
                </Group>
              </Stack>
            </SettingCard>

            {import.meta.env.DEV && (
              <SettingCard
                icon={<IconBug />}
                title={t("secDebug")}
                iconColor="var(--mantine-color-red-filled)"
              >
                <SettingSwitch
                  label={t("prefSimulateDownloadFailure")}
                  checked={settings.debug?.simulateDownloadFailure || false}
                  onChange={(e) =>
                    onUpdate((prev) => ({
                      ...prev,
                      debug: {
                        ...prev.debug,
                        simulateDownloadFailure: e.currentTarget.checked,
                      },
                    }))
                  }
                />
              </SettingCard>
            )}
          </Stack>
        </SimpleGrid>
      </Stack>
    </ScrollArea>
  );
};

export default SettingsPage;
