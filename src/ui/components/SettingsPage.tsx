import { useState, useEffect, useRef, useCallback } from "react";
import {
  Stack,
  Group,
  Title,
  Text,
  Button,
  ScrollArea,
  Badge,
  Transition,
} from "@mantine/core";
import { t } from "../../core/utils/i18n";
import {
  IconSettings,
  IconRestore,
  IconCheck,
} from "@tabler/icons-react";
import type { Settings } from "../../types";
import { GeneralSection } from "./settings/sections/GeneralSection";
import { FileSavingSection } from "./settings/sections/FileSavingSection";
import { ExtractionSection } from "./settings/sections/ExtractionSection";
import { FilterDefaultsSection } from "./settings/sections/FilterDefaultsSection";
import { DownloadSection } from "./settings/sections/DownloadSection";
import { SupportSection } from "./settings/sections/SupportSection";

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

  const handleFilterDefaultsChange = useCallback(
    (updates: Partial<Settings["filterDefaults"]>) => {
      onUpdate((prev) => ({
        ...prev,
        filterDefaults: { ...prev.filterDefaults, ...updates },
      }));
    },
    [onUpdate],
  );

  const handleGifStrategyChange = useCallback(
    (val: Settings["gifStrategy"]) => {
      onUpdate((prev) => ({
        ...prev,
        gifStrategy: val,
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
                aria-hidden="true"
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
                    aria-live="polite"
                    leftSection={<IconCheck size={10} aria-hidden="true" />}
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
          <GeneralSection
            settings={settings.general}
            onUpdate={handleGeneralChange}
            portalNode={portalNode}
          />
          <FileSavingSection
            settings={settings.fileSaving}
            onUpdate={handleFileSavingChange}
            portalNode={portalNode}
          />
          <ExtractionSection
            settings={settings.interfaceBehavior}
            onUpdate={handleInterfaceChange}
            portalNode={portalNode}
          />
          <FilterDefaultsSection
            settings={settings.filterDefaults}
            onUpdate={handleFilterDefaultsChange}
            portalNode={portalNode}
          />
          <DownloadSection
            settings={settings}
            onUpdateDownloadLogic={handleDownloadLogicChange}
            onUpdateDownloadControl={handleDownloadControlChange}
            onUpdateGifStrategy={handleGifStrategyChange}
            portalNode={portalNode}
          />
          <SupportSection
            settings={settings.debug}
            onUpdateDebug={handleDebugChange}
          />
        </Stack>
      </Stack>
    </ScrollArea>
  );
};

export default SettingsPage;
