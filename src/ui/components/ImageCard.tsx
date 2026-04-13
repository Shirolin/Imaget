import React, { memo } from "react";
import {
  Card,
  Image,
  Text,
  Badge,
  Group,
  Overlay,
  Checkbox,
  Box,
  Stack,
  ActionIcon,
} from "@mantine/core";
import { t } from "../../core/utils/i18n";
import {
  IconExternalLink,
  IconCopy,
  IconDownload,
  IconEye,
  IconCheck,
} from "@tabler/icons-react";
import { ImageItem } from "../../types";
import { PortalTooltip } from "./common/PortalTooltip";
import { GlassActionIcon } from "./common/GlassActionIcon";

interface ImageCardProps {
  item: ImageItem;
  layout?: "grid" | "columns" | "list";
  onSelect: (id: string) => void;
  onPreview?: (url: string) => void;
  onDownload?: (item: ImageItem) => void;
  portalNode: HTMLDivElement | null;
}

const ImageCardBase: React.FC<ImageCardProps> = ({
  item,
  layout = "grid",
  onSelect,
  onPreview,
  onDownload,
  portalNode,
}) => {
  const [hovered, setHovered] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getFormatColor = (format: string) => {
    const f = format.toLowerCase();
    if (f.includes("jpg") || f.includes("jpeg")) return "orange.4";
    if (f.includes("png")) return "blue.4";
    if (f.includes("svg")) return "violet.4";
    if (f.includes("webp")) return "teal.4";
    if (f.includes("gif")) return "pink.4";
    if (f.includes("avif")) return "cyan.4";
    if (f.includes("bmp")) return "yellow.4";
    if (f.includes("ico")) return "lime.4";
    if (f.includes("tiff") || f.includes("tif")) return "indigo.4";
    if (f.includes("heic") || f.includes("heif")) return "grape.4";
    return "gray.4";
  };

  const badgeStyle: React.CSSProperties = {
    backgroundColor:
      "color-mix(in srgb, var(--mantine-color-black), transparent 55%)",
    border:
      "1px solid color-mix(in srgb, var(--mantine-color-white), transparent 92%)",
  };

  const isSvg = item.format === "SVG";

  if (layout === "list") {
    return (
      <Card
        withBorder
        padding="xs"
        shadow={hovered ? "md" : "sm"}
        style={{
          cursor: "pointer",
          borderColor: item.isSelected
            ? "var(--mantine-color-blue-filled)"
            : "var(--mantine-color-dark-4)",
          transition: "all 0.2s ease",
          backgroundColor: hovered
            ? "var(--mantine-color-dark-6)"
            : "var(--mantine-color-dark-8)",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onSelect(item.id)}
      >
        <Group align="center" gap="md" wrap="nowrap">
          <Image
            src={item.url}
            w={{ base: 60, xs: 80 }}
            h={{ base: 45, xs: 60 }}
            radius="sm"
            alt={t("imgAlt")}
            fit={isSvg ? "contain" : "cover"}
            bg={isSvg ? "dark.7" : "transparent"}
            fallbackSrc={`https://placehold.co/400x400?text=${encodeURIComponent(t("imgLoadError"))}`}
            loading="lazy"
          />
          <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
            <Text size="xs" truncate fw={500} c="dimmed">
              {item.url}
            </Text>
            <Group gap={4} wrap="wrap">
              <Badge
                size="xs"
                variant="filled"
                bg="rgba(0, 0, 0, 0.4)"
                style={badgeStyle}
              >
                {item.width}x{item.height}
              </Badge>
              {item.sizeKB > 0 && (
                <Badge
                  size="xs"
                  variant="filled"
                  bg="rgba(0, 0, 0, 0.4)"
                  style={badgeStyle}
                  visibleFrom="xs"
                >
                  {item.sizeKB} KB
                </Badge>
              )}
              <Badge
                size="xs"
                variant="filled"
                bg="rgba(0, 0, 0, 0.4)"
                c={getFormatColor(item.format)}
                style={badgeStyle}
              >
                {item.format}
              </Badge>
            </Group>
          </Stack>
          <Group gap={4} wrap="nowrap">
            <Group gap={4} wrap="nowrap" visibleFrom="sm">
              <PortalTooltip
                label={t("labelOpenLink")}
                position="bottom"
                portalNode={portalNode}
              >
                <ActionIcon
                  variant="light"
                  color="gray"
                  size="sm"
                  radius="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(item.url, "_blank");
                  }}
                >
                  <IconExternalLink size={16} />
                </ActionIcon>
              </PortalTooltip>
              <PortalTooltip
                label={copied ? t("labelCopied") : t("labelCopyLink")}
                position="bottom"
                portalNode={portalNode}
              >
                <ActionIcon
                  variant="light"
                  color={copied ? "teal" : "gray"}
                  size="sm"
                  radius="sm"
                  onClick={handleCopy}
                >
                  {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                </ActionIcon>
              </PortalTooltip>
            </Group>

            <PortalTooltip
              label={t("labelPreview")}
              position="bottom"
              portalNode={portalNode}
            >
              <ActionIcon
                variant="light"
                color="gray"
                size="sm"
                radius="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview?.(item.url);
                }}
              >
                <IconEye size={16} />
              </ActionIcon>
            </PortalTooltip>
            <PortalTooltip
              label={t("labelSaveFile")}
              position="bottom"
              portalNode={portalNode}
            >
              <ActionIcon
                variant="light"
                color="gray"
                size="sm"
                radius="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload?.(item);
                }}
              >
                <IconDownload size={16} />
              </ActionIcon>
            </PortalTooltip>
            <Box onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={item.isSelected}
                onChange={() => onSelect(item.id)}
                size="xs"
                color="blue"
                aria-label={t("labelSelectImage", [item.filename || item.url])}
                styles={{
                  input: {
                    cursor: "pointer",
                    backgroundColor: "var(--mantine-color-dark-7)",
                    borderColor: "var(--mantine-color-dark-4)",
                  },
                }}
              />
            </Box>
          </Group>
        </Group>

        {item.isSelected && (
          <Overlay
            color="var(--mantine-color-blue-8)"
            backgroundOpacity={0.05}
            zIndex={1}
            style={{ pointerEvents: "none" }}
          />
        )}
      </Card>
    );
  }

  return (
    <Card
      withBorder
      padding={0}
      shadow={hovered ? "lg" : "sm"}
      style={{
        cursor: "pointer",
        transform: hovered ? "translateY(-4px)" : "none",
        borderColor: item.isSelected
          ? "var(--mantine-color-blue-filled)"
          : "var(--mantine-color-dark-4)",
        transition: "all 0.2s ease",
        overflow: "hidden",
        backgroundColor: "var(--mantine-color-dark-8)",
        willChange: "transform",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(item.id)}
    >
      <Card.Section style={{ position: "relative", overflow: "hidden" }}>
        <Image
          src={item.url}
          height={layout === "columns" ? 300 : 160}
          alt={t("imgAlt")}
          fit={isSvg ? "contain" : "cover"}
          bg={isSvg ? "dark.7" : "transparent"}
          fallbackSrc={`https://placehold.co/400x400?text=${encodeURIComponent(t("imgLoadError"))}`}
          loading="lazy"
        />

        {/* Top Badges */}
        <Box
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            right: 8,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "start",
            zIndex: 2,
          }}
        >
          <Stack gap={4}>
            <Badge
              variant="filled"
              bg="rgba(0, 0, 0, 0.4)"
              size="xs"
              style={badgeStyle}
            >
              {item.width}x{item.height}
            </Badge>
            {item.sizeKB > 0 && (
              <Badge
                variant="filled"
                bg="rgba(0, 0, 0, 0.4)"
                size="xs"
                style={badgeStyle}
              >
                {item.sizeKB} KB
              </Badge>
            )}
          </Stack>

          <Badge
            variant="filled"
            bg="rgba(0, 0, 0, 0.4)"
            size="xs"
            c={getFormatColor(item.format)}
            fw={700}
            style={{
              ...badgeStyle,
              border: `1px solid var(--mantine-color-${getFormatColor(item.format).split(".")[0]}-9)`,
            }}
          >
            {item.format}
          </Badge>
        </Box>

        {/* Selection & Actions Glass Pill */}
        <Box
          style={{
            position: "absolute",
            bottom: 10,
            right: 10,
            left: 10,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 3,
            opacity: hovered || item.isSelected ? 1 : 0,
            transform: hovered ? "translateY(0)" : "translateY(4px)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <Group
            gap="xs"
            p={4}
            bg="dark.7"
            style={{
              borderRadius: 100,
              border: "1px solid var(--mantine-color-dark-4)",
              boxShadow: "var(--mantine-shadow-lg)",
            }}
          >
            <GlassActionIcon
              label={t("labelOpenLink")}
              portalNode={portalNode}
              icon={<IconExternalLink size={18} />}
              onClick={(e) => {
                e.stopPropagation();
                window.open(item.url, "_blank");
              }}
            />
            <GlassActionIcon
              label={copied ? t("labelCopied") : t("labelCopyLink")}
              portalNode={portalNode}
              icon={copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
              color={copied ? "teal.4" : "gray.0"}
              onClick={handleCopy}
            />
            <GlassActionIcon
              label={t("labelPreview")}
              portalNode={portalNode}
              icon={<IconEye size={18} />}
              onClick={(e) => {
                e.stopPropagation();
                onPreview?.(item.url);
              }}
            />
            <GlassActionIcon
              label={t("labelSaveFile")}
              portalNode={portalNode}
              icon={<IconDownload size={18} />}
              onClick={(e) => {
                e.stopPropagation();
                onDownload?.(item);
              }}
            />
          </Group>

          <Box onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={item.isSelected}
              onChange={() => onSelect(item.id)}
              size="sm"
              color="blue"
              aria-label={t("labelSelectImage", [item.filename || item.url])}
              styles={{
                input: {
                  cursor: "pointer",
                  backgroundColor: "var(--mantine-color-dark-7)",
                  borderColor: "var(--mantine-color-dark-4)",
                  boxShadow: item.isSelected
                    ? "0 0 0 2px var(--mantine-color-blue-filled)"
                    : "var(--mantine-shadow-sm)",
                },
              }}
            />
          </Box>
        </Box>
      </Card.Section>

      {item.isSelected && (
        <Overlay
          color="var(--mantine-color-blue-8)"
          backgroundOpacity={0.1}
          zIndex={1}
          style={{ pointerEvents: "none" }}
        />
      )}
    </Card>
  );
};
export const ImageCard = memo(ImageCardBase);
export default ImageCard;
