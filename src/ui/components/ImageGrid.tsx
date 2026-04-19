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
import { ImageCard } from "./ImageCard";

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
  const [prevItems, setPrevItems] = useState(items);
  const observerTarget = useRef<HTMLDivElement>(null);

  if (items !== prevItems) {
    setPrevItems(items);
    setVisibleCount(40);
  }

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
          <Stack gap={4} align="center">
            <Text fw={700} size="md" c="bright">
              {t("loading")}
            </Text>
            <Text size="xs" c="dimmed">
              探索网页中的图片中...
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
            style={{
              borderRadius: "50%",
              backgroundColor: "var(--mantine-color-dark-6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconPhotoOff
              size={48}
              stroke={1.5}
              color="var(--mantine-color-dark-3)"
            />
          </Box>
          <Stack gap={4} align="center">
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
        <Stack gap="sm" style={{ paddingTop: 4, paddingBottom: 4 }}>
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
      <SimpleGrid
        cols={cols}
        spacing="md"
        style={{ paddingTop: 4, paddingBottom: 4 }}
      >
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
          paddingBottom: 40,
        },
      }}
    >
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
export default ImageGrid;
