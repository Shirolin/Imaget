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
import { useI18n } from "../hooks/useI18n";
import {
  IconExternalLink,
  IconCopy,
  IconDownload,
  IconEye,
  IconCheck,
  IconPhoto,
} from "@tabler/icons-react";
import { type ImageItem, getFormatColor } from "../../types";
import { PortalTooltip } from "./common/PortalTooltip";
import { GlassActionIcon } from "./common/GlassActionIcon";
import {
  revealThumbnailImage,
  syncCachedThumbnail,
  markThumbnailError,
} from "../utils/thumbnail-state";
import { useProtectedImageUrl } from "../hooks/useProtectedImageUrl";

interface ImageCardProps {
  item: ImageItem;
  layout?: "grid" | "columns" | "list";
  onSelect: (id: string, isShift?: boolean) => void;
  onPreview?: (id: string) => void;
  onDownload?: (item: ImageItem) => void;
  portalNode: HTMLDivElement | null;
}

const badgeStyle: React.CSSProperties = {
  backgroundColor:
    "color-mix(in srgb, var(--mantine-color-black), transparent 55%)",
  border:
    "1px solid color-mix(in srgb, var(--mantine-color-white), transparent 92%)",
};

export const imageThumbStyles = `
  .imaget-thumb {
    position: relative;
    overflow: hidden;
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0)),
      var(--mantine-color-dark-7);
  }

  .imaget-thumb img {
    opacity: 0;
    transition: opacity 140ms ease-out;
  }

  .imaget-thumb[data-loaded="true"] img {
    opacity: 1;
  }

  .imaget-thumb__placeholder,
  .imaget-thumb__error {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--mantine-color-dark-2);
    pointer-events: none;
    transition: opacity 120ms ease-out;
  }

  .imaget-thumb[data-loaded="true"] .imaget-thumb__placeholder,
  .imaget-thumb__error {
    opacity: 0;
  }

  .imaget-thumb[data-error="true"] .imaget-thumb__placeholder,
  .imaget-thumb[data-error="true"] img {
    opacity: 0;
  }

  .imaget-thumb[data-error="true"] .imaget-thumb__error {
    opacity: 0.72;
  }

  @media (prefers-reduced-motion: reduce) {
    .imaget-thumb img,
    .imaget-thumb__placeholder,
    .imaget-thumb__error {
      transition: none;
    }
  }
`;

export const ImageThumbStyles = () => <style>{imageThumbStyles}</style>;

interface ImageThumbProps {
  item: ImageItem;
  isSvg: boolean;
  height?: number;
  width?: { base: number; xs: number };
  radius?: string;
  fit: "cover" | "contain";
}

const ImageThumb: React.FC<ImageThumbProps> = ({
  item,
  isSvg,
  height,
  width,
  radius,
  fit,
}) => {
  const { t } = useI18n();
  const imageRef = React.useCallback((node: HTMLImageElement | null) => {
    if (node) syncCachedThumbnail(node);
  }, []);
  // 对于受限 CDN，使用代理 Blob URL
  const displaySrc = useProtectedImageUrl(item.url);

  return (
    <Box
      data-image-thumb
      className="imaget-thumb"
      style={{
        width: width ? undefined : "100%",
        height,
        borderRadius: radius ? "var(--mantine-radius-sm)" : undefined,
      }}
      w={width}
      h={height}
    >
      <Box className="imaget-thumb__placeholder" aria-hidden="true">
        <IconPhoto size={height && height <= 80 ? 18 : 24} stroke={1.5} />
      </Box>
      <Image
        ref={imageRef}
        src={displaySrc}
        w="100%"
        h="100%"
        radius={radius}
        alt={t("imgAlt")}
        fit={fit}
        bg={isSvg ? "dark.7" : "transparent"}
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={(event) => {
          void revealThumbnailImage(event.currentTarget);
        }}
        onError={(event) => {
          const currentTarget = event.currentTarget;
          if (
            currentTarget.src.includes("i.pximg.net") &&
            (currentTarget.src.includes("/img-original/") ||
              currentTarget.src.includes("/novel-cover-original/")) &&
            currentTarget.src.endsWith(".jpg")
          ) {
            currentTarget.src = currentTarget.src.replace(/\.jpg$/, ".png");
            return;
          }
          markThumbnailError(currentTarget);
        }}
      />
      <Box className="imaget-thumb__error">
        <Text size="xs" c="dimmed">
          {t("imgLoadError")}
        </Text>
      </Box>
    </Box>
  );
};

const ImageCardBase: React.FC<ImageCardProps> = ({
  item,
  layout = "grid",
  onSelect,
  onPreview,
  onDownload,
  portalNode,
}) => {
  const { t } = useI18n();
  const [hovered, setHovered] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            ? "var(--mantine-color-brand-filled)"
            : "var(--mantine-color-dark-4)",
          transition: "all 0.2s ease",
          backgroundColor: hovered
            ? "var(--mantine-color-dark-6)"
            : "var(--mantine-color-dark-8)",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={(e) => onSelect(item.id, e.shiftKey)}
      >
        <Group align="center" gap="md" wrap="nowrap">
          <ImageThumb
            item={item}
            isSvg={isSvg}
            width={{ base: 60, xs: 80 }}
            height={60}
            radius="sm"
            fit={isSvg ? "contain" : "cover"}
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
                  onPreview?.(item.id);
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
            <Box
              onClick={(e) => e.stopPropagation()}
              style={{
                opacity: hovered || item.isSelected ? 1 : 0.5,
                transition: "opacity 0.2s ease",
              }}
            >
              <Checkbox
                checked={item.isSelected}
                onChange={() => onSelect(item.id, false)}
                size="xs"
                color="brand"
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
            color="var(--mantine-color-brand-8)"
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
          ? "var(--mantine-color-brand-filled)"
          : "var(--mantine-color-dark-4)",
        transition: "all 0.2s ease",
        overflow: "hidden",
        backgroundColor: "var(--mantine-color-dark-8)",
        willChange: "transform",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => onSelect(item.id, e.shiftKey)}
    >
      <Card.Section style={{ position: "relative", overflow: "hidden" }}>
        <ImageThumb
          item={item}
          isSvg={isSvg}
          height={layout === "columns" ? 300 : 160}
          fit={isSvg ? "contain" : "cover"}
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
                onPreview?.(item.id);
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

          <Box
            onClick={(e) => e.stopPropagation()}
            style={{
              opacity: hovered || item.isSelected ? 1 : 0.6,
              transition: "opacity 0.2s ease",
              filter: "drop-shadow(0 0 2px rgba(0,0,0,0.5))",
            }}
          >
            <Checkbox
              checked={item.isSelected}
              onChange={() => onSelect(item.id, false)}
              size="sm"
              color="brand"
              aria-label={t("labelSelectImage", [item.filename || item.url])}
              styles={{
                input: {
                  cursor: "pointer",
                  backgroundColor: "rgba(30, 30, 30, 0.4)",
                  backdropFilter: "blur(4px)",
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  boxShadow: item.isSelected
                    ? "0 0 0 2px var(--mantine-color-brand-filled)"
                    : "var(--mantine-shadow-sm)",
                },
              }}
            />
          </Box>
        </Box>
      </Card.Section>

      {item.isSelected && (
        <Overlay
          color="var(--mantine-color-brand-8)"
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
