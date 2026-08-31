import React, { useState, useEffect, useRef, memo } from "react";
import {
  SimpleGrid,
  ScrollArea,
  Stack,
  Box,
  Center,
  Loader,
  Text,
} from "@mantine/core";
import { IconPhotoOff } from "@tabler/icons-react";
import { useI18n } from "../hooks/useI18n";
import type { ImageItem } from "../../types";
import { ImageCard, ImageThumbStyles } from "./ImageCard";

interface ImageGridProps {
  items: ImageItem[];
  loading?: boolean;
  layout: "grid" | "columns" | "list";
  onSelect: (id: string, isShift?: boolean) => void;
  onPreview?: (id: string) => void;
  onDownload?: (item: ImageItem) => void;
  portalNode: HTMLDivElement | null;
}

const ImageGridBase: React.FC<ImageGridProps> = ({
  items,
  loading,
  layout,
  onSelect,
  onPreview,
  onDownload,
  portalNode,
}) => {
  const { t } = useI18n();
  const [visibleCount, setVisibleCount] = useState(40);
  const observerTarget = useRef<HTMLDivElement>(null);
  const prevIdsRef = useRef<string[] | null>(null);

  useEffect(() => {
    // 区分「整体列表变化」（重新排序/替换/删除）与「尾部增量新增」：
    // 仅整体变化时重置分页，增量追加时保持当前浏览窗口，避免 follow-scan 反复跳回顶部。
    const ids = items.map((item) => item.id);
    const prevIds = prevIdsRef.current;

    let shouldReset = prevIds === null;
    if (prevIds) {
      const isAppendOnly =
        ids.length > prevIds.length &&
        prevIds.every((id, index) => id === ids[index]);
      const isSameSequence =
        ids.length === prevIds.length &&
        prevIds.every((id, index) => id === ids[index]);
      shouldReset = !isAppendOnly && !isSameSequence;
    }

    if (shouldReset) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisibleCount(40);
    }

    prevIdsRef.current = ids;
  }, [items]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < items.length) {
          setVisibleCount((prev) => prev + 40);
        }
      },
      { threshold: 0.1, rootMargin: "200px" },
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [visibleCount, items.length]);

  const visibleItems = items.slice(0, visibleCount);

  if (loading && items.length === 0) {
    return (
      <Center style={{ flex: 1 }} p="xl">
        <Stack align="center" gap="lg">
          <Loader size={40} variant="bars" color="blue" />
          <Stack gap="xs" align="center">
            <Text fw={700} size="md" c="bright">
              {t("loading")}
            </Text>
            <Text size="xs" c="dimmed">
              {t("exploringImages")}
            </Text>
          </Stack>
        </Stack>
      </Center>
    );
  }

  if (items.length === 0) {
    return (
      <Center style={{ flex: 1 }} p="xl">
        <Stack align="center" gap="md" style={{ opacity: 0.6 }}>
          <Box
            p="xl"
            bg="dark.6"
            c="dark.3"
            style={{
              borderRadius: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconPhotoOff size={48} stroke={1.5} color="currentColor" />
          </Box>
          <Stack gap="xs" align="center">
            <Text fw={700} size="lg" c="bright">
              {t("noImages")}
            </Text>
            <Text size="sm" c="dimmed" ta="center" maw={300}>
              {t("noImagesHint")}
            </Text>
          </Stack>
        </Stack>
      </Center>
    );
  }

  const renderContent = () => {
    if (layout === "list") {
      return (
        <Stack gap="sm" pt="xs" pb="xs">
          {visibleItems.map((item) => (
            <ImageCard
              key={item.id}
              item={item}
              onSelect={onSelect}
              onPreview={onPreview}
              onDownload={onDownload}
              portalNode={portalNode}
              layout="list"
            />
          ))}
        </Stack>
      );
    }

    const cols =
      layout === "columns"
        ? { base: 2, xs: 2, sm: 2 }
        : { base: 2, xs: 2, sm: 3, md: 4, lg: 5 };

    return (
      <SimpleGrid cols={cols} spacing="md" pt="xs" pb="xs">
        {visibleItems.map((item) => (
          <ImageCard
            key={item.id}
            item={item}
            onSelect={onSelect}
            onPreview={onPreview}
            onDownload={onDownload}
            portalNode={portalNode}
            layout={layout}
          />
        ))}
      </SimpleGrid>
    );
  };

  return (
    <ScrollArea
      style={{ flex: 1 }}
      p="md"
      pt="lg"
      pb="xl"
      scrollbarSize={6}
      offsetScrollbars
      styles={{
        scrollbar: {
          transition: "opacity 0.2s ease",
          backgroundColor: "transparent",
        },
        thumb: {
          backgroundColor: "var(--mantine-color-dark-4)",
          transition: "background-color 0.2s ease",
        },
        viewport: {
          paddingBottom: "var(--mantine-spacing-xl)",
        },
      }}
    >
      <ImageThumbStyles />
      {renderContent()}

      <Box ref={observerTarget} h={20} mt="md">
        {visibleCount < items.length && (
          <Center>
            <Loader size="sm" variant="dots" />
          </Center>
        )}
      </Box>
    </ScrollArea>
  );
};

export const ImageGrid = memo(ImageGridBase);
