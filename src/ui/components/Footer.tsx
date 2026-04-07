import { Group, Button, Text, ActionIcon, Box, Divider } from "@mantine/core";
import { t } from "../../core/utils/i18n";
import {
  IconDownload,
  IconArchive,
  IconSelectAll,
  IconMinus,
  IconPhoto,
  IconFilter,
  IconCircleCheck,
} from "@tabler/icons-react";
import { PortalTooltip } from "./common/PortalTooltip";

interface FooterProps {
  selectedCount: number;
  filteredCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDownload: () => void;
  onZip: () => void;
  loading?: boolean;
  portalNode: HTMLDivElement | null;
}

const Footer: React.FC<FooterProps> = ({
  selectedCount,
  filteredCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onDownload,
  onZip,
  loading,
  portalNode,
}) => {
  return (
    <Box p="xs" style={{ borderTop: "1px solid var(--mantine-color-dark-4)" }}>
      <Group justify="space-between" gap="xs" wrap="wrap">
        <Group
          gap="xs"
          w={{ base: "100%", sm: "auto" }}
          justify="space-between"
        >
          <Group gap={4} style={{ cursor: "default" }}>
            <PortalTooltip
              label={t("statSelected")}
              portalNode={portalNode}
              openDelay={300}
            >
              <Group gap={4} c={selectedCount > 0 ? "blue" : "dimmed"}>
                <IconCircleCheck size={16} />
                <Text
                  size="xs"
                  fw={700}
                  miw={20}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {selectedCount}
                </Text>
              </Group>
            </PortalTooltip>

            <Divider orientation="vertical" h={12} mt={4} />

            <PortalTooltip
              label={t("statFilter")}
              portalNode={portalNode}
              openDelay={300}
            >
              <Group gap={4} c="gray.4">
                <IconFilter size={16} />
                <Text
                  size="xs"
                  fw={700}
                  miw={20}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {filteredCount}
                </Text>
              </Group>
            </PortalTooltip>

            <Divider orientation="vertical" h={12} mt={4} />

            <PortalTooltip
              label={t("statTotal")}
              portalNode={portalNode}
              openDelay={300}
            >
              <Group gap={4} c="dark.2">
                <IconPhoto size={16} />
                <Text
                  size="xs"
                  fw={700}
                  miw={20}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {totalCount}
                </Text>
              </Group>
            </PortalTooltip>
          </Group>

          <Group gap={2}>
            <ActionIcon
              title={t("selectAll")}
              aria-label={t("labelSelectAll")}
              onClick={onSelectAll}
              size="sm"
            >
              <IconSelectAll size={16} />
            </ActionIcon>
            <ActionIcon
              title={t("deselectAll")}
              aria-label={t("labelDeselectAll")}
              color="gray"
              onClick={onDeselectAll}
              size="sm"
            >
              <IconMinus size={16} />
            </ActionIcon>
          </Group>
        </Group>

        <Group gap="xs" w={{ base: "100%", sm: "auto" }} wrap="nowrap">
          <Button
            variant="light"
            leftSection={<IconArchive size={16} />}
            onClick={onZip}
            loading={loading}
            disabled={selectedCount === 0}
            size="xs"
            flex={1}
          >
            {t("downloadZip")}
          </Button>
          <Button
            leftSection={<IconDownload size={16} />}
            onClick={onDownload}
            loading={loading}
            disabled={selectedCount === 0}
            size="xs"
            flex={1}
          >
            {t("btnDownload")}
          </Button>
        </Group>
      </Group>
    </Box>
  );
};

export default Footer;
