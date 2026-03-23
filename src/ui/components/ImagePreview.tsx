import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Box,
  ActionIcon,
  Tooltip,
  Group,
  Stack,
  Text,
  Image,
} from "@mantine/core";
import {
  IconZoomIn,
  IconZoomOut,
  IconRotate,
  IconArrowsMaximize,
  IconFocus2,
  IconX,
} from "@tabler/icons-react";
import { t } from "../../core/utils/i18n";

interface ImagePreviewProps {
  url: string;
  onClose: () => void;
  portalNode: HTMLDivElement | null;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  url,
  onClose,
  portalNode,
}) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const currentOffsetRef = useRef({ x: 0, y: 0 });
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleZoom = useCallback((delta: number) => {
    setScale((prev) => Math.min(Math.max(prev + delta, 0.1), 10));
  }, []);

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const handleReset = useCallback(() => {
    setScale(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
    currentOffsetRef.current = { x: 0, y: 0 };
  }, []);

  const handleOriginalSize = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    currentOffsetRef.current = { x: 0, y: 0 };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - currentOffsetRef.current.x,
      y: e.clientY - currentOffsetRef.current.y,
    };
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;

      const updatePosition = () => {
        const newX = e.clientX - dragStartRef.current.x;
        const newY = e.clientY - dragStartRef.current.y;

        currentOffsetRef.current = { x: newX, y: newY };
        setOffset({ x: newX, y: newY });
        requestRef.current = null;
      };

      if (requestRef.current === null) {
        requestRef.current = requestAnimationFrame(updatePosition);
      }
    },
    [isDragging],
  );

  const handleMouseUp = () => {
    setIsDragging(false);
    if (requestRef.current !== null) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
  };

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      handleZoom(delta);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
    }
    return () => {
      if (container) container.removeEventListener("wheel", handleWheel);
    };
  }, [handleZoom]);

  return (
    <Box
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        cursor: isDragging ? "grabbing" : "grab",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale}) rotate(${rotation}deg)`,
          transition: isDragging
            ? "none"
            : "transform 0.15s cubic-bezier(0.2, 0, 0, 1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <Box style={{ pointerEvents: "auto" }}>
          <Image
            src={url}
            alt="Preview"
            draggable={false}
            onDragStart={(e: React.DragEvent) => e.preventDefault()}
            style={{
              maxWidth: "90vw",
              maxHeight: "90vh",
              objectFit: "contain",
              userSelect: "none",
              boxShadow: "var(--mantine-shadow-xl)",
            }}
          />
        </Box>
      </Box>

      <Box
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          width: "auto",
          maxWidth: "96vw",
        }}
      >
        <Group
          gap="xs"
          px={{ base: "xs", xs: "md" }}
          py="xs"
          bg="dark.7"
          justify="center"
          wrap="wrap"
          style={{
            borderRadius: 24,
            border: "1px solid var(--mantine-color-dark-4)",
            boxShadow: "var(--mantine-shadow-lg)",
            backdropFilter: "blur(12px)",
          }}
        >
          <Group gap={4} wrap="nowrap">
            <Tooltip
              label={t("labelZoomOut")}
              position="top"
              openDelay={500}
              portalProps={{ target: portalNode || undefined }}
            >
              <ActionIcon
                variant="subtle"
                color="gray.2"
                radius="xl"
                size="lg"
                onClick={() => handleZoom(-0.2)}
              >
                <IconZoomOut size={20} />
              </ActionIcon>
            </Tooltip>

            <Text size="xs" fw={700} w={36} ta="center" c="gray.2">
              {Math.round(scale * 100)}%
            </Text>

            <Tooltip
              label={t("labelZoomIn")}
              position="top"
              openDelay={500}
              portalProps={{ target: portalNode || undefined }}
            >
              <ActionIcon
                variant="subtle"
                color="gray.2"
                radius="xl"
                size="lg"
                onClick={() => handleZoom(0.2)}
              >
                <IconZoomIn size={20} />
              </ActionIcon>
            </Tooltip>
          </Group>

          <Box w={1} h={20} bg="dark.4" visibleFrom="xs" />

          <Group gap={4} wrap="nowrap">
            <Tooltip
              label={t("labelRotate")}
              position="top"
              openDelay={500}
              portalProps={{ target: portalNode || undefined }}
            >
              <ActionIcon
                variant="subtle"
                color="gray.2"
                radius="xl"
                size="lg"
                onClick={handleRotate}
              >
                <IconRotate size={20} />
              </ActionIcon>
            </Tooltip>

            <Tooltip
              label={t("labelFit")}
              position="top"
              openDelay={500}
              portalProps={{ target: portalNode || undefined }}
            >
              <ActionIcon
                variant="subtle"
                color="gray.2"
                radius="xl"
                size="lg"
                onClick={handleReset}
              >
                <IconArrowsMaximize size={20} />
              </ActionIcon>
            </Tooltip>

            <Tooltip
              label={t("labelOriginalSize")}
              position="top"
              openDelay={500}
              portalProps={{ target: portalNode || undefined }}
            >
              <ActionIcon
                variant="subtle"
                color="gray.2"
                radius="xl"
                size="lg"
                onClick={handleOriginalSize}
              >
                <IconFocus2 size={20} />
              </ActionIcon>
            </Tooltip>
          </Group>

          <Box w={1} h={20} bg="dark.4" />

          <Tooltip
            label={t("labelCloseEsc")}
            position="top"
            openDelay={500}
            portalProps={{ target: portalNode || undefined }}
          >
            <ActionIcon
              variant="subtle"
              color="red.6"
              radius="xl"
              size="lg"
              onClick={onClose}
            >
              <IconX size={20} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Box>

      <Stack
        gap={2}
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          pointerEvents: "none",
          opacity: 0.6,
        }}
      >
        <Text size="xs" c="dimmed">
          {t("hintWheel")}
        </Text>
        <Text size="xs" c="dimmed">
          {t("hintDrag")}
        </Text>
        <Text size="xs" c="dimmed">
          {t("hintClick")}
        </Text>
      </Stack>
    </Box>
  );
};
