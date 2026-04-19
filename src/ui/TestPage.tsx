import React, { useEffect, useRef, memo, useState } from "react";
import {
  Title,
  Text,
  Stack,
  SimpleGrid,
  Badge,
  Card,
  Image,
  Box,
  Group,
  Container,
  Overlay,
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

const generateInitialGallery = (): GalleryItem[] => {
  const getRandomId = () => Math.floor(Math.random() * 1000) + 1;
  return [
    // Mixed aspect ratios to showcase Masonry
    { id: getRandomId(), width: 1920, height: 1080, label: "Golden Coast" },
    { id: getRandomId(), width: 1080, height: 1920, label: "Urban Vertical" },
    { id: getRandomId(), width: 800, height: 800, label: "Studio Square" },
    { id: getRandomId(), width: 3840, height: 2160, label: "Alpine 4K" },
    { id: getRandomId(), width: 600, height: 1200, label: "Narrow Tower" },
    { id: getRandomId(), width: 1200, height: 600, label: "Wide Horizon" },
    ...Array.from({ length: 30 }).map((_, i) => {
      const isPortrait = Math.random() > 0.6;
      return {
        id: getRandomId(),
        width: isPortrait ? 600 : 800,
        height: isPortrait ? 900 : 600,
        label: `Moment #${i + 1}`,
      };
    }),
  ];
};

// ==============================================
// Sub-components
// ==============================================

const ShadowBox = memo(({ url }: { url: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const currentContainer = containerRef.current;
    if (currentContainer && !currentContainer.shadowRoot) {
      const shadow = currentContainer.attachShadow({ mode: "open" });
      const img = document.createElement("img");
      img.src = url;
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      img.style.borderRadius = "12px";
      shadow.appendChild(img);
    }
  }, [url]);
  return <Box ref={containerRef} h={180} />;
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
  <Stack gap={4} mb="xl">
    <Group gap="xs">
      <Icon size={28} color="var(--mantine-color-blue-4)" />
      <Title order={2} fw={800} style={{ letterSpacing: -0.5 }}>
        {title}
      </Title>
    </Group>
    <Text c="dimmed" size="sm" maw={500}>
      {description}
    </Text>
  </Stack>
);

// ==============================================
// Main Page
// ==============================================

const TestPage: React.FC = () => {
  const [gallery] = useState<GalleryItem[]>(generateInitialGallery);
  const [heroId] = useState(() => Math.floor(Math.random() * 1000) + 1);

  return (
    <Box
      style={{
        backgroundColor: "#050505", // Deeper black for high contrast
        minHeight: "100vh",
        color: "#eee",
      }}
    >
      {/* Hero Section */}
      <Box style={{ position: "relative", height: 500, overflow: "hidden" }}>
        <Image
          src={`https://picsum.photos/id/${heroId}/2560/800`}
          h={500}
          w="100%"
          fit="cover"
        />
        <Overlay
          gradient="linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(5, 5, 5, 1) 100%)"
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
            justifyContent: "center",
          }}
        >
          <Stack gap="xs">
            <Text
              c="blue.4"
              fw={900}
              size="xs"
              tt="uppercase"
              style={{ letterSpacing: 4 }}
            >
              Imaget Engine v2.0
            </Text>
            <Title
              order={1}
              size={64}
              fw={900}
              style={{ color: "#fff", lineHeight: 1, marginBottom: 16 }}
            >
              High-Precision <br />
              Sniffer Sandbox
            </Title>
            <Text c="gray.5" size="lg" maw={550} style={{ lineHeight: 1.6 }}>
              A premium exhibition environment designed to stress-test recursive
              DOM traversal and multi-dimensional image filtering.
            </Text>
          </Stack>
        </Container>
      </Box>

      <Container size="xl" py={100}>
        <Stack gap={120}>
          {/* Section 1: Masonry Gallery */}
          <Box>
            <SectionHeader
              icon={IconPhoto}
              title="Dynamic Masonry"
              description="A mixed-ratio gallery to verify that the sniffer handles various aspect ratios (16:9, 9:16, 1:1) correctly without distortion."
            />

            {/* Native CSS Masonry using columns */}
            <Box
              style={{
                columnCount: 4,
                columnGap: "20px",
                // Responsive columns via style (since standard CSS is used)
              }}
            >
              {gallery.map((item, idx) => (
                <Card
                  key={`${item.id}-${idx}`}
                  padding={0}
                  radius="lg"
                  bg="#111"
                  style={{
                    breakInside: "avoid",
                    marginBottom: "20px",
                    border: "1px solid #222",
                    overflow: "hidden",
                    cursor: "zoom-in",
                    transition: "transform 0.3s ease, border-color 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.02)";
                    e.currentTarget.style.borderColor =
                      "var(--mantine-color-blue-7)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.borderColor = "#222";
                  }}
                >
                  <Box style={{ position: "relative" }}>
                    <Image
                      src={`https://picsum.photos/id/${item.id}/${Math.round(item.width / 4)}/${Math.round(item.height / 4)}`}
                      alt={item.label}
                      loading="lazy"
                    />

                    {/* Bottom Info Overlay on Card */}
                    <Box
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: "12px",
                        background:
                          "linear-gradient(transparent, rgba(0,0,0,0.8))",
                        pointerEvents: "none",
                      }}
                    >
                      <Text fw={700} size="xs" c="white" truncate>
                        {item.label}
                      </Text>
                      <Text size="10px" c="blue.2" fw={500}>
                        {item.width} × {item.height}
                      </Text>
                    </Box>
                  </Box>
                </Card>
              ))}
            </Box>
          </Box>

          {/* Section 2: Technical Test Cases */}
          <Box>
            <SectionHeader
              icon={IconFlask}
              title="Industrial Scenarios"
              description="Verifying detection across complex web implementations like Picture tags, Backgrounds, and Shadow DOM."
            />
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">
              {TEST_CASES.map((tc) => (
                <Card
                  key={tc.id}
                  padding={0}
                  radius="lg"
                  bg="#111"
                  style={{ border: "1px solid #222" }}
                >
                  <Box
                    h={200}
                    style={{ position: "relative", overflow: "hidden" }}
                  >
                    {tc.type === "img" && (
                      <Image src={tc.url} h="100%" fit="cover" />
                    )}
                    {tc.type === "background" && (
                      <Box
                        h="100%"
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
                            height: "200px",
                            objectFit: "cover",
                          }}
                          alt={tc.title}
                        />
                      </picture>
                    )}
                    {tc.type === "shadow-dom" && <ShadowBox url={tc.url} />}
                    {tc.type === "svg" && (
                      <Image src={tc.url} h="100%" fit="contain" p="xl" />
                    )}
                    <Badge
                      variant="filled"
                      color="dark"
                      size="xs"
                      pos="absolute"
                      top={10}
                      right={10}
                      style={{ zIndex: 5 }}
                    >
                      {tc.type.toUpperCase()}
                    </Badge>
                  </Box>
                  <Box p="md">
                    <Text fw={700} size="sm" c="white">
                      {tc.title}
                    </Text>
                  </Box>
                </Card>
              ))}
            </SimpleGrid>
          </Box>

          {/* Section 3: Deep Context Nesting */}
          <Box>
            <SectionHeader
              icon={IconDeviceLaptop}
              title="Nested Contexts"
              description="Stress-testing the recursive sniffer with multi-level DOM hierarchies."
            />
            <Box
              p={40}
              style={{
                background: "#080808",
                border: "1px dashed #333",
                borderRadius: "20px",
              }}
            >
              <section>
                <article>
                  <Group align="flex-start" gap={40}>
                    <Image
                      src="https://picsum.photos/id/15/600/400"
                      w={300}
                      radius="lg"
                      style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}
                    />
                    <Stack gap="md" style={{ flex: 1 }}>
                      <Title order={3} fw={900}>
                        Recursive Traversal
                      </Title>
                      <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
                        This image is buried deep inside nested Section and
                        Article tags. It validates that Imaget doesn't stop at
                        top-level nodes and correctly reaches every leaf of the
                        DOM tree.
                      </Text>
                      <Divider color="#222" />
                      <Text size="xs" ff="monospace" c="blue.4">
                        Status: Searchable & Capture-ready
                      </Text>
                    </Stack>
                  </Group>
                </article>
              </section>
            </Box>
          </Box>
        </Stack>
      </Container>

      {/* Page Footer */}
      <Box
        py={60}
        style={{ borderTop: "1px solid #222", background: "#050505" }}
      >
        <Container size="xl">
          <Group justify="space-between">
            <Text size="xs" c="dimmed" fw={500}>
              &copy; 2026 IMAGET LABORATORY. ALL ASSETS POWERED BY PICSUM.
            </Text>
            <Badge variant="outline" color="blue" size="sm">
              DEV MODE ACTIVE
            </Badge>
          </Group>
        </Container>
      </Box>
    </Box>
  );
};

export default memo(TestPage);
