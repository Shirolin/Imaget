import React, { memo } from "react";
import {
  Group,
  Title,
  ActionIcon,
  Text,
  Tooltip,
  SegmentedControl,
  Image,
  Box,
} from "@mantine/core";
import { t } from "../../core/utils/i18n";
import {
  IconX,
  IconRefresh,
  IconArrowsDown,
  IconPhoto,
  IconSettings,
  IconHeart,
  IconBrandGithub,
  IconCoffee,
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

const HeaderBase: React.FC<HeaderProps> = ({
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
      style={{ borderBottom: "1px solid var(--mantine-color-dark-4)" }}
    >
      <Group gap="md" visibleFrom="xs" wrap="nowrap">
        <Group gap="xs" wrap="nowrap">
          <Image
            src={
              typeof chrome !== "undefined" && chrome.runtime?.getURL
                ? chrome.runtime.getURL("favicon.svg")
                : "/favicon.svg"
            }
            w={24}
            h={24}
          />
          <Title order={4} c="blue" style={{ letterSpacing: 1 }}>
            IMAGET
          </Title>
        </Group>

        <Box w={1} h={16} bg="dark.4" />

        <Group gap={2} wrap="nowrap">
          <Tooltip
            label={t("labelGithub") || "GitHub"}
            position="bottom"
            withArrow
            portalProps={{ target: portalNode || undefined }}
          >
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={() =>
                window.open("https://github.com/Shirolin/New-Imaget", "_blank")
              }
              size="sm"
              aria-label={t("labelGithub") || "GitHub"}
            >
              <IconBrandGithub size={16} />
            </ActionIcon>
          </Tooltip>

          <Tooltip
            label={t("labelAfdian") || "Afdian"}
            position="bottom"
            withArrow
            portalProps={{ target: portalNode || undefined }}
          >
            <ActionIcon
              variant="subtle"
              color="blue"
              onClick={() =>
                window.open("https://ifdian.net/a/shirolin", "_blank")
              }
              size="sm"
              aria-label={t("labelAfdian") || "Afdian"}
            >
              <IconHeart size={16} fill="currentColor" />
            </ActionIcon>
          </Tooltip>

          <Tooltip
            label={t("labelKofi") || "Ko-fi"}
            position="bottom"
            withArrow
            portalProps={{ target: portalNode || undefined }}
          >
            <ActionIcon
              variant="subtle"
              color="orange"
              onClick={() =>
                window.open("https://ko-fi.com/shirolin", "_blank")
              }
              size="sm"
              aria-label={t("labelKofi") || "Ko-fi"}
            >
              <IconCoffee size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
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
        styles={{
          root: {
            backgroundColor: "var(--mantine-color-dark-9)",
            border: "1px solid var(--mantine-color-dark-4)",
            padding: 2,
          },
          indicator: {
            backgroundColor: "var(--mantine-color-dark-4)",
            boxShadow: "var(--mantine-shadow-md)",
          },
          control: {
            border: "none",
          },
          label: {
            paddingTop: 4,
            paddingBottom: 4,
            "&[data-active]": {
              color: "var(--mantine-color-white)",
            },
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
              aria-label={t("labelDeepScan")}
            >
              <IconArrowsDown size={18} />
            </ActionIcon>
          </Tooltip>
        )}

        {onRefresh && (
          <Tooltip
            label={t("labelRefresh")}
            position="bottom"
            withArrow
            portalProps={{ target: portalNode || undefined }}
          >
            <ActionIcon
              variant="default"
              onClick={onRefresh}
              loading={isScanning}
              size="md"
              visibleFrom="xs"
              aria-label={t("labelRefresh")}
            >
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
        )}

        <ActionIcon
          variant="subtle"
          color="gray"
          onClick={onClose}
          size="md"
          aria-label={t("labelCloseEsc")}
        >
          <IconX size={20} />
        </ActionIcon>
      </Group>
    </Group>
  );
};

export const Header = memo(HeaderBase);
export default Header;
