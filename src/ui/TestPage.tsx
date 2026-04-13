import React, { useEffect, useRef } from "react";
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
} from "@mantine/core";
import { TEST_CASES } from "../core/test-cases";

const ShadowBox: React.FC<{ url: string }> = ({ url }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && !containerRef.current.shadowRoot) {
      const shadow = containerRef.current.attachShadow({ mode: "open" });
      const img = document.createElement("img");
      img.src = url;
      img.style.width = "100%";
      img.style.height = "150px";
      img.style.objectFit = "cover";
      shadow.appendChild(img);
    }
  }, [url]);

  return <Box ref={containerRef} h={150} />;
};

const TestPage: React.FC = () => {
  return (
    <Container
      size="xl"
      py="xl"
      style={{
        backgroundColor: "var(--mantine-color-dark-9)",
        minHeight: "100vh",
        color: "var(--mantine-color-dark-0)",
      }}
    >
      <Stack gap="xl">
        <Box>
          <Title order={1}>Sniffer Test Bench</Title>
          <Text c="dimmed">
            This page contains various image integration scenarios for testing
            the Sniffer engine.
          </Text>
        </Box>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
          {TEST_CASES.map((tc) => (
            <Card key={tc.id} withBorder shadow="sm" radius="md">
              <Card.Section>
                {tc.type === "img" && (
                  <Image src={tc.url} height={150} alt={tc.title} fit="cover" />
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
                <Text fw={500} size="sm">
                  {tc.title}
                </Text>
                <Text size="xs" c="dimmed">
                  {tc.type.toUpperCase()}
                </Text>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>

        <Box py="xl" style={{ borderTop: "1px solid #ddd" }}>
          <Title order={2} mb="md">
            Complex Realistic Scenarios
          </Title>
          <Stack gap="xl">
            {/* Deeply Nested Container */}
            <Box
              p="md"
              bg="dark.8"
              style={{
                border: "1px dashed var(--mantine-color-dark-4)",
                borderRadius: "var(--mantine-radius-md)",
              }}
            >
              <Text size="sm" mb="xs" fw={700} c="bright">
                Deeply Nested Context
              </Text>
              <Box>
                <Box component="section">
                  <Box component="article">
                    <Box style={{ position: "relative" }}>
                      <img
                        src="https://picsum.photos/id/15/300/200"
                        alt="Nested"
                        style={{ borderRadius: 8, display: "block" }}
                      />
                      <Text size="xs" mt="xs" c="dimmed">
                        This image is nested: Box (section) {" > "} Box
                        (article) {" > "} Box {" > "} img
                      </Text>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Overlapping items */}
            <Box
              h={250}
              bg="dark.8"
              style={{
                position: "relative",
                overflow: "hidden",
                border: "1px solid var(--mantine-color-dark-4)",
                borderRadius: "var(--mantine-radius-md)",
              }}
            >
              <Text size="sm" p="xs" fw={700} c="bright">
                Absolute Positioning & Z-Index
              </Text>
              <img
                src="https://picsum.photos/id/16/600/300"
                style={{
                  position: "absolute",
                  top: 50,
                  left: 20,
                  width: 200,
                  zIndex: 1,
                }}
                alt="Overlap 1"
              />
              <img
                src="https://picsum.photos/id/17/600/300"
                style={{
                  position: "absolute",
                  top: 80,
                  left: 100,
                  width: 200,
                  zIndex: 2,
                  border: "4px solid var(--mantine-color-dark-8)",
                }}
                alt="Overlap 2"
              />
            </Box>

            {/* Hidden / Transparent Images */}
            <Box p="md" bg="dark.8" style={{ borderRadius: 8 }}>
              <Text size="sm" mb="xs" fw={700}>
                Edge Cases (Hidden/Small/DataURL)
              </Text>
              <Group>
                <Box>
                  <Text size="xs" c="dimmed">
                    Opacity 0.1
                  </Text>
                  <img
                    src="https://picsum.photos/id/18/50/50"
                    style={{ opacity: 0.1 }}
                    alt="Ghost"
                  />
                </Box>
                <Box>
                  <Text size="xs" c="dimmed">
                    Base64 PNG
                  </Text>
                  <img
                    src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAAbUlEQVRYhe3XMQ6AIAwF0GfCBeT+R+T+ByS6uBgnE6MDSVv8D5v0SNoXpAbA99o8B8AzI8mMc85f670PAOC9p875mZnXAFhvIDUhNSGNCI0IDYmNCI0IDQlNCY0JDYnNCG1G6GfG98X4C0+8+AL8L5fW5AAAAABJRU5ErkJggg=="
                    alt="Base64"
                  />
                </Box>
                <Box>
                  <Text size="xs" c="dimmed">
                    0x0 hidden
                  </Text>
                  <div style={{ width: 0, height: 0, overflow: "hidden" }}>
                    <img
                      src="https://picsum.photos/id/20/800/800"
                      alt="Hidden"
                    />
                  </div>
                </Box>
                <Text size="xs" c="dimmed" style={{ flex: 1 }}>
                  Contains low-opacity, tiny (Base64), and zero-sized container
                  images to test sniffer robustness.
                </Text>
              </Group>
            </Box>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
};
export default TestPage;
