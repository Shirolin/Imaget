import React from "react";
import { Stack, Group, Text, Divider, SimpleGrid } from "@mantine/core";
import { IconLanguage } from "@tabler/icons-react";
import { t } from "../../../core/utils/i18n";
import { Settings } from "../../../types";
import { PortalSelect } from "../../common/PortalSelect";
import { SettingCard } from "../SettingCard";

interface GeneralSectionProps {
  settings: Settings["general"];
  onUpdate: (updates: Partial<Settings["general"]>) => void;
  portalNode: HTMLDivElement | null;
}

export const GeneralSection: React.FC<GeneralSectionProps> = ({
  settings,
  onUpdate,
  portalNode,
}) => {
  return (
    <Stack gap="md">
      <Stack gap="xs">
        <Group gap="xs">
          <Text fw={700} size="sm" c="dimmed" tt="uppercase">
            {t("secGeneral") || "General"}
          </Text>
          <Divider style={{ flex: 1 }} opacity={0.5} />
        </Group>
      </Stack>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
        <SettingCard
          icon={<IconLanguage />}
          title={t("secLanguage")}
          iconColor="var(--mantine-color-cyan-filled)"
        >
          <PortalSelect
            label={t("prefLanguage")}
            placeholder={t("selectPlaceholder")}
            value={settings.language}
            portalNode={portalNode}
            onChange={(val) =>
              onUpdate({
                language: (val as Settings["general"]["language"]) || "auto",
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
      </SimpleGrid>
    </Stack>
  );
};
