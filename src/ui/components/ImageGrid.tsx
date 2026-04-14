import React, { useState, useEffect, useRef } from "react";
import {
  SimpleGrid,
  ScrollArea,
  Stack,
  Box,
  Center,
  Loader,
} from "@mantine/core";
import type { ImageItem } from "../../types";
import { ImageCard } from "./ImageCard";

interface ImageGridProps {
  items: ImageItem[];
  layout: "grid" | "columns" | "list";
  onSelect: (id: string, isShift?: boolean) => void;
  onPreview?: (id: string) => void;
  onDownload?: (item: ImageItem) => void;
  portalNode: HTMLDivElement | null;
}

const ImageGrid: React.FC<ImageGridProps> = ({
  items,
  layout,
  onSelect,
  onPreview,
  onDownload,
  portalNode,
}) => {
  const [visibleCount, setVisibleCount] = useState(40);
  const [prevItems, setPrevItems] = useState(items);
  const observerTarget = useRef<HTMLDivElement>(null);

  // 当 items 改变（筛选）时，重置可见数量 (在渲染期间处理，避免 useEffect 级联渲染)
  if (items !== prevItems) {
    setPrevItems(items);
    setVisibleCount(40);
  }

  // 监听滚动到底部
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

    // Grid or Columns
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
    <ScrollArea style={{ flex: 1 }} p="md" pt="lg" pb="xl">
      {renderContent()}

      {/* 滚动监听目标 */}
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

export default ImageGrid;
