import { useState, useEffect, useCallback, useRef } from "react";
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
  ActionIcon,
  Tooltip,
  ScrollArea,
  Radio,
  Badge,
  Transition,
  Divider,
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
  IconCheck,
  IconPlus,
  IconX,
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
  const [showSaved, setShowSaved] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const isInitialMount = useRef(true);

  // Stable handlers to prevent child re-renders
  const handleGeneralChange = useCallback(
    (updates: Partial<Settings["general"]>) => {
      onUpdate((prev) => ({
        ...prev,
        general: { ...prev.general, ...updates },
      }));
    },
    [onUpdate],
  );

  const handleFileSavingChange = useCallback(
    (updates: Partial<Settings["fileSaving"]>) => {
      onUpdate((prev) => ({
        ...prev,
        fileSaving: { ...prev.fileSaving, ...updates },
      }));
    },
    [onUpdate],
  );

  const handleInterfaceChange = useCallback(
    (updates: Partial<Settings["interfaceBehavior"]>) => {
      onUpdate((prev) => ({
        ...prev,
        interfaceBehavior: { ...prev.interfaceBehavior, ...updates },
      }));
    },
    [onUpdate],
  );

  const handleDownloadLogicChange = useCallback(
    (updates: Partial<Settings["downloadLogic"]>) => {
      onUpdate((prev) => ({
        ...prev,
        downloadLogic: { ...prev.downloadLogic, ...updates },
      }));
    },
    [onUpdate],
  );

  const handleDownloadControlChange = useCallback(
    (updates: Partial<Settings["downloadControl"]>) => {
      onUpdate((prev) => ({
        ...prev,
        downloadControl: { ...prev.downloadControl, ...updates },
      }));
    },
    [onUpdate],
  );

  const handleGifStrategyChange = useCallback(
    (val: string) => {
      onUpdate((prev) => ({
        ...prev,
        gifStrategy: val as "keep" | "firstFrame" | "skip",
      }));
    },
    [onUpdate],
  );

  const handleDebugChange = useCallback(
    (updates: Partial<NonNullable<Settings["debug"]>>) => {
      onUpdate((prev) => ({
        ...prev,
        debug: {
          simulateDownloadFailure:
            updates.simulateDownloadFailure ??
            prev.debug?.simulateDownloadFailure ??
            false,
        },
      }));
    },
    [onUpdate],
  );

  // 模拟保存状态反馈
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    let hideTimer: ReturnType<typeof setTimeout>;
    const timer = setTimeout(() => {
      setShowSaved(true);
      hideTimer = setTimeout(() => setShowSaved(false), 2000);
    }, 0);

    return () => {
      clearTimeout(timer);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, [settings]);

  const handleAddDomain = useCallback(() => {
    const domain = newDomain.trim().toLowerCase();
    if (!domain) return;

    if (settings.interfaceBehavior.disabledDomains?.includes(domain)) {
      setNewDomain("");
      return;
    }

    handleInterfaceChange({
      disabledDomains: [
        ...(settings.interfaceBehavior.disabledDomains || []),
        domain,
      ],
    });
    setNewDomain("");
  }, [
    newDomain,
    settings.interfaceBehavior.disabledDomains,
    handleInterfaceChange,
  ]);

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
        <Group justify="space-between" wrap="nowrap">
          <Stack gap={0} style={{ overflow: "hidden" }}>
            <Group gap="xs" wrap="nowrap">
              <IconSettings
                size={22}
                style={{
                  color: "var(--mantine-color-blue-filled)",
                  flexShrink: 0,
                }}
              />
              <Title order={3} style={{ whiteSpace: "nowrap" }}>
                {t("tabPreferences")}
              </Title>
              <Transition
                mounted={showSaved}
                transition="fade"
                duration={400}
                timingFunction="ease"
              >
                {(styles) => (
                  <Badge
                    variant="light"
                    color="green"
                    size="xs"
                    leftSection={<IconCheck size={10} />}
                    style={{ ...styles, flexShrink: 0 }}
                  >
                    {t("statusSaved") || "已保存"}
                  </Badge>
                )}
              </Transition>
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

        <Stack gap="xl">
          {/* --- Section: General --- */}
          <Stack gap="md">
            <Group gap="xs">
              <Text fw={700} size="sm" c="dimmed" tt="uppercase">
                {t("secGeneral") || "General"}
              </Text>
              <Divider style={{ flex: 1 }} opacity={0.5} />
            </Group>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
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
                    handleGeneralChange({
                      language:
                        (val as Settings["general"]["language"]) || "auto",
                    })
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
                    handleFileSavingChange({ subfolder: e.currentTarget.value })
                  }
                  placeholder={t("prefSubfolderPlaceholder")}
                />
                <TextInput
                  label={t("prefFilename")}
                  value={settings.fileSaving.filenameTemplate}
                  styles={{ input: { cursor: "text" } }}
                  onChange={(e) =>
                    handleFileSavingChange({
                      filenameTemplate: e.currentTarget.value,
                    })
                  }
                  rightSection={
                    <Tooltip
                      label={t("viewVariables")}
                      portalProps={{ target: portalNode || undefined }}
                    >
                      <ActionIcon
                        variant="transparent"
                        color="gray"
                        aria-label={t("viewVariables")}
                      >
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
                      handleFileSavingChange({
                        filenameTemplate: "{page_title}_{date}_{time}_{index}",
                      })
                    }
                  >
                    {t("resetDefault")}
                  </Button>
                  <Button
                    variant="default"
                    size="compact-xs"
                    radius="xl"
                    onClick={() =>
                      handleFileSavingChange({ filenameTemplate: "{origin}" })
                    }
                  >
                    {t("useOriginal")}
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
                  <Text size="xs" c="dimmed" mb={8} fw={500}>
                    {t("viewVariables")} (点击插入):
                  </Text>
                  <Group gap={6}>
                    {[
                      "{date}",
                      "{time}",
                      "{title}",
                      "{index}",
                      "{page_title}",
                      "{origin}",
                    ].map((variable) => (
                      <Badge
                        key={variable}
                        variant="light"
                        color="blue"
                        size="sm"
                        style={{ cursor: "pointer", textTransform: "none" }}
                        onClick={() =>
                          handleFileSavingChange({
                            filenameTemplate:
                              settings.fileSaving.filenameTemplate + variable,
                          })
                        }
                      >
                        {variable}
                      </Badge>
                    ))}
                  </Group>
                </Box>
              </SettingCard>
            </SimpleGrid>
          </Stack>

          {/* --- Section: Extraction --- */}
          <Stack gap="md">
            <Group gap="xs">
              <Text fw={700} size="sm" c="dimmed" tt="uppercase">
                {t("secExtraction") || "Extraction"}
              </Text>
              <Divider style={{ flex: 1 }} opacity={0.5} />
            </Group>
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
                    checked={settings.interfaceBehavior.showInSidebar}
                    onChange={(e) =>
                      handleInterfaceChange({
                        showInSidebar: e.currentTarget.checked,
                      })
                    }
                  />
                  <SettingSwitch
                    label={t("prefHideDownloadWarning")}
                    checked={settings.interfaceBehavior.hideDownloadWarning}
                    onChange={(e) =>
                      handleInterfaceChange({
                        hideDownloadWarning: e.currentTarget.checked,
                      })
                    }
                  />
                  <SettingSwitch
                    label={t("prefSearchAllFrames")}
                    checked={settings.interfaceBehavior.searchAllFrames}
                    onChange={(e) =>
                      handleInterfaceChange({
                        searchAllFrames: e.currentTarget.checked,
                      })
                    }
                  />
                  <SettingSwitch
                    label={t("prefIdentifyBackgroundImages")}
                    checked={
                      settings.interfaceBehavior.identifyBackgroundImages
                    }
                    onChange={(e) =>
                      handleInterfaceChange({
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
                      checked={settings.interfaceBehavior.showFloatingButton}
                      onChange={(e) =>
                        handleInterfaceChange({
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
                      [0, 32, 64, 128, 256].includes(
                        settings.interfaceBehavior.minImageSize,
                      )
                        ? settings.interfaceBehavior.minImageSize.toString()
                        : "custom"
                    }
                    onChange={(val) => {
                      let newSize = parseInt(val || "0");
                      if (val === "custom") {
                        newSize = [0, 32, 64, 128, 256].includes(
                          settings.interfaceBehavior.minImageSize,
                        )
                          ? settings.interfaceBehavior.minImageSize + 1
                          : settings.interfaceBehavior.minImageSize;
                      }
                      handleInterfaceChange({ minImageSize: newSize });
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
                  {![0, 32, 64, 128, 256].includes(
                    settings.interfaceBehavior.minImageSize,
                  ) && (
                    <NumberInput
                      size="xs"
                      placeholder={t("prefMinImageSize")}
                      value={settings.interfaceBehavior.minImageSize}
                      onChange={(val) =>
                        handleInterfaceChange({
                          minImageSize: typeof val === "number" ? val : 0,
                        })
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

                {!settings.interfaceBehavior.disabledDomains ||
                settings.interfaceBehavior.disabledDomains.length === 0 ? (
                  <Text size="sm" c="dimmed" fs="italic">
                    {t("noDisabledDomains")}
                  </Text>
                ) : (
                  <Group gap="xs" wrap="wrap">
                    {settings.interfaceBehavior.disabledDomains.map(
                      (domain) => (
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
                              handleInterfaceChange({
                                disabledDomains:
                                  settings.interfaceBehavior.disabledDomains?.filter(
                                    (d) => d !== domain,
                                  ) || [],
                              });
                            }}
                            aria-label={t("btnRemoveDomain")}
                          >
                            <IconX size={12} stroke={3} />
                          </ActionIcon>
                        </Box>
                      ),
                    )}
                  </Group>
                )}
              </SettingCard>
            </SimpleGrid>
          </Stack>

          {/* --- Section: Download --- */}
          <Stack gap="md">
            <Group gap="xs">
              <Text fw={700} size="sm" c="dimmed" tt="uppercase">
                {t("secDownload") || "Download"}
              </Text>
              <Divider style={{ flex: 1 }} opacity={0.5} />
            </Group>
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
                    handleDownloadLogicChange({
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
                    onChange={(val) =>
                      handleDownloadLogicChange({ quality: val })
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
                    handleDownloadLogicChange({
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
                    handleDownloadControlChange({
                      conflictResolution:
                        (val as "uniquify" | "overwrite" | "prompt") ||
                        "uniquify",
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
                    handleDownloadControlChange({
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
                onChange={handleGifStrategyChange}
              >
                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                  {(["keep", "firstFrame", "skip"] as const).map((strategy) => (
                    <Box
                      key={strategy}
                      onClick={() => handleGifStrategyChange(strategy)}
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
                      }}
                    >
                      <Radio
                        value={strategy}
                        label={
                          strategy === "keep"
                            ? t("gifOriginal")
                            : strategy === "firstFrame"
                              ? t("gifExtract")
                              : t("gifSkip")
                        }
                        styles={{
                          label: {
                            fontWeight:
                              settings.gifStrategy === strategy ? 600 : 400,
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

          {/* --- Section: Support & Info --- */}
          <Stack gap="md">
            <Group gap="xs">
              <Text fw={700} size="sm" c="dimmed" tt="uppercase">
                {t("secSupport") || "Support"}
              </Text>
              <Divider style={{ flex: 1 }} opacity={0.5} />
            </Group>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
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
                      handleDebugChange({
                        simulateDownloadFailure: e.currentTarget.checked,
                      })
                    }
                  />
                </SettingCard>
              )}
            </SimpleGrid>
          </Stack>
        </Stack>
      </Stack>
    </ScrollArea>
  );
};

export default SettingsPage;
