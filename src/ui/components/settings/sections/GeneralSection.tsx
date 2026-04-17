import React, { memo, useState, useEffect } from "react";
import {
  Stack,
  Group,
  Text,
  Divider,
  SimpleGrid,
  Transition,
  Badge,
} from "@mantine/core";
import { IconLanguage, IconCheck } from "@tabler/icons-react";
import { useI18n } from "../../../hooks/useI18n";
import type { Settings } from "../../../../types";
import { SettingCard } from "../SettingCard";
import { PortalSelect } from "../../common/PortalSelect";

interface GeneralSectionProps {
  settings: Settings["general"];
  onUpdate: (updates: Partial<Settings["general"]>) => void;
  portalNode: HTMLDivElement | null;
}

export const GeneralSection = memo(
  ({ settings, onUpdate, portalNode }: GeneralSectionProps) => {
    const { t } = useI18n();
    const [showFeedback, setShowFeedback] = useState(false);

    // 监听反馈状态
    useEffect(() => {
      let timer: number;
      if (showFeedback) {
        timer = window.setTimeout(() => setShowFeedback(false), 2000);
      }
      return () => clearTimeout(timer);
    }, [showFeedback]);

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
            <Stack gap="xs">
              <PortalSelect
                label={t("prefLanguage")}
                aria-label={t("prefLanguage")}
                placeholder={t("selectPlaceholder")}
                value={settings.language}
                portalNode={portalNode}
                onChange={(val) => {
                  onUpdate({
                    language:
                      (val as Settings["general"]["language"]) || "auto",
                  });
                  setShowFeedback(true);
                }}
                data={[
                  { value: "auto", label: "Auto" },
                  { value: "en", label: "English" },
                  { value: "zh_CN", label: "简体中文" },
                  { value: "zh_TW", label: "繁體中文" },
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
              <Transition
                mounted={showFeedback}
                transition="fade"
                duration={400}
              >
                {(styles) => (
                  <Badge
                    variant="light"
                    color="green"
                    size="xs"
                    leftSection={<IconCheck size={10} />}
                    style={{ ...styles, alignSelf: "flex-start" }}
                  >
                    {t("statusSaved") || "Updated"}
                  </Badge>
                )}
              </Transition>
            </Stack>
          </SettingCard>
        </SimpleGrid>
      </Stack>
    );
  },
);
