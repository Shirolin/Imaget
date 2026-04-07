import React from "react";
import { SimpleGrid, ScrollArea, Stack } from "@mantine/core";
import { ImageItem } from "../../types";
import { ImageCard } from "./ImageCard";

interface ImageGridProps {
  items: ImageItem[];
  layout: "grid" | "columns" | "list";
  onSelect: (id: string) => void;
  onPreview?: (url: string) => void;
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
  if (layout === "list") {
    return (
      <ScrollArea style={{ flex: 1 }} p="md" pt="lg" pb="xl">
        <Stack gap="sm" style={{ paddingTop: 4, paddingBottom: 4 }}>
          {items.map((item) => (
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
      </ScrollArea>
    );
  }

  // Grid or Columns
  const cols =
    layout === "columns"
      ? { base: 2, xs: 2, sm: 2 }
      : { base: 2, xs: 2, sm: 3, md: 4, lg: 5 };

  return (
    <ScrollArea style={{ flex: 1 }} p="md" pt="lg" pb="xl">
      <SimpleGrid
        cols={cols}
        spacing="md"
        style={{ paddingTop: 4, paddingBottom: 4 }}
      >
        {items.map((item) => (
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
    </ScrollArea>
  );
};

export default ImageGrid;
