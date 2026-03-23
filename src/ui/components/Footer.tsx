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
    <Box p="md" style={{ borderTop: "1px solid var(--mantine-color-dark-4)" }}>
      <Group justify="space-between" gap="md" wrap="wrap">
        <Group gap="sm" w={{ base: "100%", xs: "auto" }}>
          <Group gap="xs" style={{ cursor: "default" }}>
            <PortalTooltip
              label={t("statSelected")}
              portalNode={portalNode}
              openDelay={300}
            >
              <Group gap={6} c={selectedCount > 0 ? "blue" : "dimmed"}>
                <IconCircleCheck size={18} />
                <Text
                  size="sm"
                  fw={700}
                  miw={32}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {selectedCount}
                </Text>
              </Group>
            </PortalTooltip>

            <Divider orientation="vertical" h={14} mt={4} />

            <PortalTooltip
              label={t("statFilter")}
              portalNode={portalNode}
              openDelay={300}
            >
              <Group gap={6} c="gray.4">
                <IconFilter size={18} />
                <Text
                  size="sm"
                  fw={700}
                  miw={32}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {filteredCount}
                </Text>
              </Group>
            </PortalTooltip>

            <Divider orientation="vertical" h={14} mt={4} />

            <PortalTooltip
              label={t("statTotal")}
              portalNode={portalNode}
              openDelay={300}
            >
              <Group gap={6} c="dark.2">
                <IconPhoto size={18} />
                <Text
                  size="sm"
                  fw={700}
                  miw={32}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {totalCount}
                </Text>
              </Group>
            </PortalTooltip>
          </Group>
          <Group gap={4}>
            <ActionIcon
              title={t("selectAll")}
              aria-label={t("labelSelectAll")}
              onClick={onSelectAll}
            >
              <IconSelectAll size={18} />
            </ActionIcon>
            <ActionIcon
              title={t("deselectAll")}
              aria-label={t("labelDeselectAll")}
              color="gray"
              onClick={onDeselectAll}
            >
              <IconMinus size={18} />
            </ActionIcon>
          </Group>
        </Group>

        <Group gap="sm" w={{ base: "100%", xs: "auto" }} wrap="nowrap">
          <Button
            variant="light"
            leftSection={<IconArchive size={18} />}
            onClick={onZip}
            loading={loading}
            disabled={selectedCount === 0}
          >
            {t("downloadZip")}
          </Button>
          <Button
            leftSection={<IconDownload size={18} />}
            onClick={onDownload}
            loading={loading}
            disabled={selectedCount === 0}
          >
            {t("btnDownload")}
          </Button>
        </Group>
      </Group>
    </Box>
  );
};

export default Footer;
