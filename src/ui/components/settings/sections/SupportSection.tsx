import React from "react";
import { Stack, Group, Text, Divider, SimpleGrid, Button } from "@mantine/core";
import {
  IconHeart,
  IconBrandGithub,
  IconCoffee,
  IconBug,
} from "@tabler/icons-react";
import { t } from "../../../../core/utils/i18n";
import type { Settings } from "../../../../types";
import { SettingCard } from "../SettingCard";
import { SettingSwitch } from "../SettingSwitch";

interface SupportSectionProps {
  settings: Settings["debug"];
  onUpdateDebug: (updates: Partial<NonNullable<Settings["debug"]>>) => void;
}

export const SupportSection: React.FC<SupportSectionProps> = ({
  settings,
  onUpdateDebug,
}) => {
  return (
    <Stack gap="md">
      <Stack gap="xs">
        <Group gap="xs">
          <Text fw={700} size="sm" c="dimmed" tt="uppercase">
            {t("secSupport") || "Support"}
          </Text>
          <Divider style={{ flex: 1 }} opacity={0.5} />
        </Group>
      </Stack>

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
                color="gray"
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
                color="gray"
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
              checked={settings?.simulateDownloadFailure || false}
              onChange={(e) =>
                onUpdateDebug({
                  simulateDownloadFailure: e.currentTarget.checked,
                })
              }
            />
          </SettingCard>
        )}
      </SimpleGrid>
    </Stack>
  );
};
