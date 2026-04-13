import {
  Group,
  Button,
  Text,
  ActionIcon,
  Box,
  Divider,
  Flex,
} from "@mantine/core";
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
          <Group gap="sm" style={{ cursor: "default" }}>
            <PortalTooltip
              label={t("statSelected")}
              portalNode={portalNode}
              openDelay={300}
            >
              <Group
                gap={4}
                c={selectedCount > 0 ? "blue" : "dimmed"}
                aria-label={`${t("statSelected")}: ${selectedCount}`}
              >
                <IconCircleCheck size={16} aria-hidden="true" />
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
              <Group
                gap={4}
                c="gray.4"
                aria-label={`${t("statFilter")}: ${filteredCount}`}
              >
                <IconFilter size={16} aria-hidden="true" />
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
              <Group
                gap={4}
                c="dark.2"
                aria-label={`${t("statTotal")}: ${totalCount}`}
              >
                <IconPhoto size={16} aria-hidden="true" />
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

          <Group gap="xs">
            <ActionIcon
              title={t("selectAll")}
              aria-label={t("labelSelectAll")}
              onClick={onSelectAll}
              size="md"
              variant="subtle"
            >
              <IconSelectAll size={18} />
            </ActionIcon>
            <ActionIcon
              title={t("deselectAll")}
              aria-label={t("labelDeselectAll")}
              color="gray"
              onClick={onDeselectAll}
              size="md"
              variant="subtle"
            >
              <IconMinus size={18} />
            </ActionIcon>
          </Group>
        </Group>

        <Flex
          gap="xs"
          w={{ base: "100%", md: "auto" }}
          wrap={{ base: "wrap", xs: "nowrap" }}
        >
          <Button
            variant="light"
            leftSection={<IconArchive size={16} />}
            onClick={onZip}
            loading={loading}
            disabled={selectedCount === 0}
            size="xs"
            flex={{ base: 1, xs: "none" }}
            miw={100}
            styles={{
              label: {
                overflow: "visible",
                whiteSpace: "normal",
                textAlign: "center",
                lineHeight: 1.1,
                paddingTop: 2,
                paddingBottom: 2,
              },
            }}
          >
            {t("downloadZip")}
          </Button>
          <Button
            leftSection={<IconDownload size={16} />}
            onClick={onDownload}
            loading={loading}
            disabled={selectedCount === 0}
            size="xs"
            flex={{ base: 1, xs: "none" }}
            miw={100}
            styles={{
              label: {
                overflow: "visible",
                whiteSpace: "normal",
                textAlign: "center",
                lineHeight: 1.1,
                paddingTop: 2,
                paddingBottom: 2,
              },
            }}
          >
            {t("btnDownload")}
          </Button>
        </Flex>
      </Group>
    </Box>
  );
};

export default Footer;
