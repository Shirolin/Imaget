import React from "react";
import {
  Group,
  Title,
  ActionIcon,
  Button,
  Box,
  UnstyledButton,
  Text,
  Tooltip,
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
}

const Header: React.FC<HeaderProps> = ({
  onClose,
  onRefresh,
  onDeepScan,
  isScanning,
  activeTab,
  onTabChange,
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
          <Tooltip label={t("labelGithub")} position="bottom" withArrow>
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
          <Tooltip label={t("labelDonate")} position="bottom" withArrow>
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

      <Box
        bg="dark.6"
        p={4}
        style={{
          display: "flex",
          borderRadius: 12,
          position: "relative",
          border: "1px solid var(--mantine-color-dark-4)",
        }}
      >
        <Box
          bg="dark.4"
          style={{
            position: "absolute",
            left: activeTab === "images" ? 4 : "50%",
            top: 4,
            bottom: 4,
            width: "calc(50% - 4px)",
            borderRadius: 8,
            transition: "all 0.2s cubic-bezier(0.25, 1, 0.5, 1)",
            zIndex: 0,
            boxShadow: "var(--mantine-shadow-sm)",
          }}
        />
        <UnstyledButton
          onClick={() => onTabChange("images")}
          miw={{ base: 80, xs: 100 }}
          style={{
            zIndex: 1,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            borderRadius: 8,
            transition: "color 0.2s ease",
            color:
              activeTab === "images"
                ? "var(--mantine-color-white)"
                : "var(--mantine-color-dark-2)",
          }}
        >
          <IconPhoto size={14} />
          <Text size="xs" fw={activeTab === "images" ? 600 : 500}>
            {t("tabImages")}
          </Text>
        </UnstyledButton>
        <UnstyledButton
          onClick={() => onTabChange("settings")}
          miw={{ base: 80, xs: 100 }}
          style={{
            zIndex: 1,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            borderRadius: 8,
            transition: "color 0.2s ease",
            color:
              activeTab === "settings"
                ? "var(--mantine-color-white)"
                : "var(--mantine-color-dark-2)",
          }}
        >
          <IconSettings size={14} />
          <Text size="xs" fw={activeTab === "settings" ? 600 : 500}>
            {t("tabPreferences")}
          </Text>
        </UnstyledButton>
      </Box>

      <Group gap="xs" wrap="nowrap">
        {onDeepScan && (
          <>
            <Tooltip
              label={t("labelDeepScan")}
              position="bottom"
              withArrow
              hiddenFrom="sm"
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
