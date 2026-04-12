import React from "react";
import {
  Group,
  Title,
  ActionIcon,
  Text,
  Tooltip,
  SegmentedControl,
  Image,
} from "@mantine/core";
import { t } from "../../core/utils/i18n";
import {
  IconX,
  IconRefresh,
  IconArrowsDown,
  IconPhoto,
  IconSettings,
} from "@tabler/icons-react";

interface HeaderProps {
  onClose: () => void;
  onRefresh?: () => void;
  onDeepScan?: () => void;
  isScanning?: boolean;
  activeTab: "images" | "settings";
  onTabChange: (tab: "images" | "settings") => void;
  portalNode: HTMLDivElement | null;
}

const Header: React.FC<HeaderProps> = ({
  onClose,
  onRefresh,
  onDeepScan,
  isScanning,
  activeTab,
  onTabChange,
  portalNode,
}) => {
  return (
    <Group
      h={60}
      px="md"
      justify="space-between"
      wrap="nowrap"
      bg="dark.8"
      style={{
        borderBottom: "1px solid var(--mantine-color-dark-4)",
      }}
    >
      <Group gap="xs" visibleFrom="xs">
        <Image src={chrome.runtime.getURL("favicon.svg")} w={24} h={24} />
        <Title order={4} c="blue" style={{ letterSpacing: 1 }}>
          IMAGET
        </Title>
      </Group>

      <SegmentedControl
        value={activeTab}
        onChange={(val: string) => onTabChange(val as "images" | "settings")}
        data={[
          {
            label: (
              <Group gap={6} wrap="nowrap" px={4}>
                <IconPhoto size={14} />
                <Text
                  size="xs"
                  fw={activeTab === "images" ? 600 : 500}
                  visibleFrom="xs"
                >
                  {t("tabImages")}
                </Text>
              </Group>
            ),
            value: "images",
          },
          {
            label: (
              <Group gap={6} wrap="nowrap" px={4}>
                <IconSettings size={14} />
                <Text
                  size="xs"
                  fw={activeTab === "settings" ? 600 : 500}
                  visibleFrom="xs"
                >
                  {t("tabPreferences")}
                </Text>
              </Group>
            ),
            value: "settings",
          },
        ]}
        radius="xl"
        size="xs"
        bg="dark.6"
        styles={{
          root: {
            border: "1px solid var(--mantine-color-dark-4)",
            padding: 2,
          },
          indicator: {
            backgroundColor: "var(--mantine-color-dark-4)",
            boxShadow: "var(--mantine-shadow-sm)",
          },
          control: {
            border: "none",
          },
          label: {
            paddingTop: 4,
            paddingBottom: 4,
          },
        }}
      />

      <Group gap={4} wrap="nowrap">
        {onDeepScan && (
          <Tooltip
            label={t("labelDeepScan")}
            position="bottom"
            withArrow
            portalProps={{ target: portalNode || undefined }}
          >
            <ActionIcon
              variant="light"
              onClick={onDeepScan}
              loading={isScanning}
              size="md"
            >
              <IconArrowsDown size={18} />
            </ActionIcon>
          </Tooltip>
        )}

        {onRefresh && (
          <ActionIcon
            variant="default"
            onClick={onRefresh}
            loading={isScanning}
            size="md"
            visibleFrom="xs"
          >
            <IconRefresh size={16} />
          </ActionIcon>
        )}

        <ActionIcon variant="subtle" color="gray" onClick={onClose} size="md">
          <IconX size={20} />
        </ActionIcon>
      </Group>
    </Group>
  );
};

export default Header;
