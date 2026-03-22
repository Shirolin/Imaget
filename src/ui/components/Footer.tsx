import { Group, Button, Text, ActionIcon, Box } from "@mantine/core";
import { t } from "../../core/utils/i18n";
import {
  IconDownload,
  IconArchive,
  IconSelectAll,
  IconMinus,
} from "@tabler/icons-react";

interface FooterProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDownload: () => void;
  onZip: () => void;
  loading?: boolean;
}

const Footer: React.FC<FooterProps> = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onDownload,
  onZip,
  loading,
}) => {
  return (
    <Box p="md" style={{ borderTop: "1px solid var(--mantine-color-dark-4)" }}>
      <Group justify="space-between" gap="md" wrap="wrap">
        <Group gap="sm" w={{ base: "100%", xs: "auto" }}>
          <Text size="sm" fw={500}>
            {t("selectedCount", [
              selectedCount.toString(),
              totalCount.toString(),
            ])}
          </Text>
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
