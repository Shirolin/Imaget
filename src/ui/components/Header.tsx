import React from "react";
import {
  Group,
  Title,
  ActionIcon,
  Button,
  Text,
  Tooltip,
  SegmentedControl,
} from "@mantine/core";
import { t } from "../../core/utils/i18n";
import {
  IconX,
  IconRefresh,
  IconArrowsDown,
  IconPhoto,
  IconSettings,
  IconBrandGithub,
  IconHeart,
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
        <Title order={4} c="blue" style={{ letterSpacing: 1 }}>
          IMAGET
        </Title>
        <Group gap={4} ml="xs">
          <Tooltip
            label={t("labelGithub")}
            position="bottom"
            withArrow
            portalProps={{ target: portalNode || undefined }}
          >
            <ActionIcon
              component="a"
              href="https://github.com/Shirolin/Imaget"
              target="_blank"
              variant="subtle"
              color="gray"
              size="sm"
            >
              <IconBrandGithub size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip
            label={t("labelDonate")}
            position="bottom"
            withArrow
            portalProps={{ target: portalNode || undefined }}
          >
            <ActionIcon
              component="a"
              href="https://ko-fi.com/shirolin"
              target="_blank"
              variant="subtle"
              color="pink"
              size="sm"
            >
              <IconHeart size={16} />
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
              <Group gap={6} wrap="nowrap" px="xs">
                <IconPhoto size={14} />
                <Text size="xs" fw={activeTab === "images" ? 600 : 500}>
                  {t("tabImages")}
                </Text>
              </Group>
            ),
            value: "images",
          },
          {
            label: (
              <Group gap={6} wrap="nowrap" px="xs">
                <IconSettings size={14} />
                <Text size="xs" fw={activeTab === "settings" ? 600 : 500}>
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
            padding: 4,
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

      <Group gap="xs" wrap="nowrap">
        {onDeepScan && (
          <>
            <Tooltip
              label={t("labelDeepScan")}
              position="bottom"
              withArrow
              hiddenFrom="sm"
              portalProps={{ target: portalNode || undefined }}
            >
              <ActionIcon
                variant="light"
                onClick={onDeepScan}
                loading={isScanning}
                size="md"
                hiddenFrom="sm"
              >
                <IconArrowsDown size={18} />
              </ActionIcon>
            </Tooltip>
            <Button
              variant="light"
              size="xs"
              onClick={onDeepScan}
              loading={isScanning}
              leftSection={<IconArrowsDown size={14} />}
              visibleFrom="sm"
            >
              {t("btnDeepScan")}
            </Button>
          </>
        )}

        {onRefresh && (
          <ActionIcon
            variant="default"
            onClick={onRefresh}
            loading={isScanning}
            size="sm"
            visibleFrom="xs"
          >
            <IconRefresh size={16} />
          </ActionIcon>
        )}

        <ActionIcon variant="subtle" color="gray" onClick={onClose} size="lg">
          <IconX size={20} />
        </ActionIcon>
      </Group>
    </Group>
  );
};

export default Header;
