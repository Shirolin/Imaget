import React, { memo } from "react";
import { Group, NumberInput, Tooltip, Button, Text } from "@mantine/core";
import { t } from "../../../core/utils/i18n";
import type { FilterOptions } from "../../../types";

interface ResolutionGroupProps {
  minWidth: number;
  minHeight: number;
  resolutionMode: "or" | "and";
  onChange: (updates: Partial<FilterOptions>) => void;
  portalNode: HTMLDivElement | null;
}

const ResolutionGroupBase: React.FC<ResolutionGroupProps> = ({
  minWidth,
  minHeight,
  resolutionMode,
  onChange,
  portalNode,
}) => {
  return (
    <Group
      gap={4}
      wrap="nowrap"
      align="center"
      px={8}
      py={2}
      bg="dark.9"
      style={{
        borderRadius: "var(--mantine-radius-md)",
        border: "1px solid var(--mantine-color-dark-4)",
      }}
    >
      <NumberInput
        aria-label={t("labelMinWidth")}
        value={minWidth}
        placeholder="W"
        onChange={(val) => onChange({ minWidth: Number(val) })}
        size="xs"
        w={50}
        min={0}
        max={9999}
        allowNegative={false}
        variant="unstyled"
        styles={{ input: { textAlign: "center", height: "24px" } }}
      />
      <Tooltip
        label={`${
          resolutionMode === "or" ? t("resModeOr") : t("resModeAnd")
        }: ${
          resolutionMode === "or" ? t("resModeOrDesc") : t("resModeAndDesc")
        }`}
        portalProps={{ target: portalNode || undefined }}
      >
        <Button
          onClick={() =>
            onChange({
              resolutionMode: resolutionMode === "or" ? "and" : "or",
            })
          }
          aria-label={`${t("resModeOr")}/${t("resModeAnd")}`}
          size="xs"
          variant="filled"
          color={resolutionMode === "or" ? "blue.9" : "teal.9"}
          px={4}
          h={18}
        >
          <Text size="9px" fw={900}>
            {resolutionMode.toUpperCase()}
          </Text>
        </Button>
      </Tooltip>
      <NumberInput
        placeholder="H"
        aria-label={t("labelMinHeight")}
        value={minHeight}
        onChange={(val) => onChange({ minHeight: Number(val) })}
        size="xs"
        w={50}
        min={0}
        max={9999}
        allowNegative={false}
        variant="unstyled"
        styles={{ input: { textAlign: "center", height: "24px" } }}
      />
    </Group>
  );
};

export const ResolutionGroup = memo(ResolutionGroupBase);
export default ResolutionGroup;
