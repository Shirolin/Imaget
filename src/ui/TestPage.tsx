import React, { useEffect, useRef, memo } from "react";
import {
  Title,
  Text,
  Stack,
  SimpleGrid,
  Card,
  Image,
  Box,
  Group,
  Container,
  Overlay,
  AspectRatio,
  Divider,
} from "@mantine/core";
import { IconPhoto, IconDeviceLaptop, IconFlask } from "@tabler/icons-react";
import { TEST_CASES } from "../core/test-cases";

// ==============================================
// Gallery Data Definition
// ==============================================
interface GalleryItem {
  id: number;
  width: number;
  height: number;
  label: string;
}

const GENERATED_GALLERY: GalleryItem[] = [
  // Huge High-Res (4K-ish)
  { id: 10, width: 3840, height: 2160, label: "Mountains 4K" },
  { id: 20, width: 2560, height: 1440, label: "Forest 2K" },
  { id: 30, width: 1920, height: 1080, label: "River FHD" },
  // Portraits
  { id: 64, width: 800, height: 1200, label: "Portrait A" },
  { id: 65, width: 1080, height: 1920, label: "Mobile Wallpaper" },
  { id: 100, width: 600, height: 1000, label: "Tall Art" },
  // Squares
  { id: 237, width: 800, height: 800, label: "Puppy Square" },
  { id: 240, width: 500, height: 500, label: "Stairs Square" },
  { id: 250, width: 300, height: 300, label: "Avatar" },
  // Landscapes
  { id: 367, width: 1200, height: 600, label: "Sea View" },
  { id: 400, width: 1600, height: 400, label: "Ultrawide Panorama" },
  { id: 450, width: 1024, height: 768, label: "Retro Landscape" },
  // Diverse IDs for variety
  ...Array.from({ length: 24 }).map((_, i) => ({
    id: i + 500,
    width: 600 + (i % 3) * 200,
    height: 400 + (i % 2) * 200,
    label: `Exhibition Item ${i + 1}`,
  })),
];

// ==============================================
// Sub-components
// ==============================================

const ShadowBox = memo(({ url }: { url: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && !containerRef.current.shadowRoot) {
      const shadow = containerRef.current.attachShadow({ mode: "open" });
      const img = document.createElement("img");
      img.src = url;
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      img.style.borderRadius = "8px";
      shadow.appendChild(img);
    }
  }, [url]);

  return <Box ref={containerRef} h={150} />;
});

const SectionHeader = ({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) => (
  <Stack gap={4} mb="lg">
    <Group gap="xs">
      <Icon size={24} color="var(--mantine-color-blue-filled)" />
      <Title order={2} style={{ letterSpacing: 0.5 }}>
        {title}
      </Title>
    </Group>
    <Text c="dimmed" size="sm">
      {description}
    </Text>
  </Stack>
);

// ==============================================
// Main Page
// ==============================================

const TestPage: React.FC = () => {
  return (
    <Box
      style={{
        backgroundColor: "var(--mantine-color-dark-9)",
        minHeight: "100vh",
        color: "var(--mantine-color-dark-0)",
      }}
    >
      {/* Hero Section */}
      <Box style={{ position: "relative", height: 400, overflow: "hidden" }}>
        <Image
          src="https://picsum.photos/id/1015/1920/600"
          h={400}
          w="100%"
          fit="cover"
        />
        <Overlay
          gradient="linear-gradient(180deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.8) 100%)"
          opacity={1}
          zIndex={1}
        />
        <Container
          size="xl"
          h="100%"
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            paddingBottom: 60,
          }}
        >
          <Stack gap={0}>
            <Text
              c="blue.4"
              fw={800}
              size="sm"
              tt="uppercase"
              style={{ letterSpacing: 2 }}
            >
              Exhibition Bench
            </Text>
            <Title
              order={1}
              size={48}
              style={{ color: "#fff", lineHeight: 1.1, marginBottom: 12 }}
            >
              Sniffer Engine <br />
              <span style={{ color: "var(--mantine-color-blue-4)" }}>
                Laboratory
              </span>
            </Title>
            <Text c="gray.4" maw={600}>
              A comprehensive stress-test environment featuring various image
              formats, resolutions, and complex DOM structures to verify the
              Imaget sniffer performance and accuracy.
            </Text>
          </Stack>
        </Container>
      </Box>

      <Container size="xl" py={60}>
        <Stack gap={80}>
          {/* Section 1: High-Res Gallery */}
          <Box>
            <SectionHeader
              icon={IconPhoto}
              title="High-Res Showcase"
              description="A diverse set of high-quality images from Picsum to test resolution and aspect ratio filtering."
            />
            <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 6 }} spacing="md">
              {GENERATED_GALLERY.map((item) => (
                <Card
                  key={item.id}
                  padding="xs"
                  radius="md"
                  withBorder
                  bg="dark.8"
                  styles={{
                    root: {
                      transition: "transform 0.2s ease, border-color 0.2s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        borderColor: "var(--mantine-color-blue-filled)",
                      },
                    },
                  }}
                >
                  <Card.Section>
                    <AspectRatio ratio={item.width / item.height}>
                      <Image
                        src={`https://picsum.photos/id/${item.id}/${Math.round(item.width / 4)}/${Math.round(item.height / 4)}`}
                        alt={item.label}
                        loading="lazy"
                      />
                    </AspectRatio>
                  </Card.Section>
                  <Stack gap={2} mt="xs">
                    <Text fw={700} size="xs" truncate>
                      {item.label}
                    </Text>
                    <Text size="10px" c="dimmed">
                      {item.width} × {item.height}
                    </Text>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          </Box>

          {/* Section 2: Technical Test Cases */}
          <Box>
            <SectionHeader
              icon={IconFlask}
              title="Developer Lab"
              description="Special integration scenarios including Shadow DOM, Background Images, and SVGs."
            />
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
              {TEST_CASES.map((tc) => (
                <Card
                  key={tc.id}
                  withBorder
                  bg="dark.8"
                  shadow="sm"
                  radius="md"
                  padding="md"
                >
                  <Card.Section>
                    {tc.type === "img" && (
                      <Image
                        src={tc.url}
                        height={150}
                        alt={tc.title}
                        fit="cover"
                      />
                    )}
                    {tc.type === "background" && (
                      <Box
                        h={150}
                        style={{
                          backgroundImage: `url(${tc.url})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />
                    )}
                    {tc.type === "picture" && (
                      <picture>
                        <source srcSet={tc.url} />
                        <img
                          src={tc.url}
                          style={{
                            width: "100%",
                            height: "150px",
                            objectFit: "cover",
                          }}
                          alt={tc.title}
                        />
                      </picture>
                    )}
                    {tc.type === "shadow-dom" && <ShadowBox url={tc.url} />}
                    {tc.type === "svg" && (
                      <Image
                        src={tc.url}
                        height={150}
                        alt={tc.title}
                        fit="contain"
                        p="md"
                      />
                    )}
                  </Card.Section>
                  <Stack gap={4} mt="sm">
                    <Text fw={600} size="sm">
                      {tc.title}
                    </Text>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                      {tc.type}
                    </Text>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          </Box>

          {/* Section 3: Deep Context Nesting */}
          <Box>
            <SectionHeader
              icon={IconDeviceLaptop}
              title="Structural Edge Cases"
              description="Testing sniffer's ability to find images hidden deep within DOM hierarchies."
            />
            <Stack gap="xl">
              <Box
                p="xl"
                bg="dark.8"
                style={{
                  border: "1px dashed var(--mantine-color-dark-4)",
                  borderRadius: "var(--mantine-radius-md)",
                }}
              >
                <Box component="section">
                  <Box component="article">
                    <Group align="flex-start" gap="xl">
                      <img
                        src="https://picsum.photos/id/15/600/400"
                        alt="Deeply Nested"
                        style={{
                          borderRadius: 12,
                          display: "block",
                          maxWidth: "100%",
                          height: "auto",
                          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                        }}
                      />
                      <Stack gap="md" style={{ flex: 1 }}>
                        <Title order={3}>The Nested Context</Title>
                        <Text size="sm" c="dimmed">
                          This image is intentionally buried deep inside Box,
                          Section, and Article components to verify recursive
                          DOM traversal.
                        </Text>
                        <Divider opacity={0.1} />
                        <Text size="xs" ff="monospace">
                          Path: Container {">"} Stack {">"} Section {">"}{" "}
                          Article {">"} Group {">"} img
                        </Text>
                      </Stack>
                    </Group>
                  </Box>
                </Box>
              </Box>
            </Stack>
          </Box>
        </Stack>
      </Container>

      {/* Page Footer */}
      <Box
        py={40}
        bg="dark.8"
        style={{ borderTop: "1px solid var(--mantine-color-dark-4)" }}
      >
        <Container size="xl">
          <Group justify="space-between">
            <Text size="xs" c="dimmed">
              Imaget Sniffer Test Page &copy; 2026
            </Text>
            <Group gap="xs">
              <Text size="xs" c="blue.4" fw={700}>
                PICSUM
              </Text>
              <Text size="xs" c="dimmed">
                POWERED
              </Text>
            </Group>
          </Group>
        </Container>
      </Box>
    </Box>
  );
};

export default memo(TestPage);
