import React, { memo } from "react";
import {
  Stack,
  Group,
  Text,
  Divider,
  SimpleGrid,
  TextInput,
  Tooltip,
  ActionIcon,
  Box,
  Button,
  Badge,
} from "@mantine/core";
import { IconFolder, IconVariable } from "@tabler/icons-react";
import { t } from "../../../../core/utils/i18n";
import type { Settings } from "../../../../types";
import { SettingCard } from "../SettingCard";

interface FileSavingSectionProps {
  settings: Settings["fileSaving"];
  onUpdate: (updates: Partial<Settings["fileSaving"]>) => void;
  portalNode: HTMLDivElement | null;
}

export const FileSavingSection = memo(({
  settings,
  onUpdate,
  portalNode,
}: FileSavingSectionProps) => {
  return (
    <Stack gap="md">
      <Stack gap="xs">
        <Group gap="xs">
          <Text fw={700} size="sm" c="dimmed" tt="uppercase">
            {t("secFileSave") || "File Saving"}
          </Text>
          <Divider style={{ flex: 1 }} opacity={0.5} />
        </Group>
      </Stack>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
        <SettingCard
          icon={<IconFolder />}
          title={t("secFileSave")}
          iconColor="var(--mantine-color-orange-filled)"
        >
          <TextInput
            label={t("prefSubfolder")}
            description={t("prefSubfolderHint")}
            value={settings.subfolder}
            styles={{ input: { cursor: "text" } }}
            onChange={(e) => onUpdate({ subfolder: e.currentTarget.value })}
            placeholder={t("prefSubfolderPlaceholder")}
          />
          <TextInput
            label={t("prefFilename")}
            description={t("prefFilenameHint", ["{origin}, {page_title}..."])}
            value={settings.filenameTemplate}
            styles={{
              input: { cursor: "text" },
              description: { marginBottom: "4px" },
            }}
            onChange={(e) =>
              onUpdate({
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
                onUpdate({
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
              onClick={() => onUpdate({ filenameTemplate: "{origin}" })}
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
                  styles={{
                    root: {
                      cursor: "pointer",
                      textTransform: "none",
                      transition: "transform 0.1s ease, background-color 0.2s ease",
                      "&:hover": {
                        backgroundColor: "var(--mantine-color-blue-light-hover)",
                      },
                      "&:active": {
                        transform: "scale(0.92)",
                      },
                    },
                  }}
                  onClick={() =>
                    onUpdate({
                      filenameTemplate: settings.filenameTemplate + variable,
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
  );
});
