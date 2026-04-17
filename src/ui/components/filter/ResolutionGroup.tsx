import React, { memo } from "react";
import { Group, NumberInput, Tooltip, Button, Text } from "@mantine/core";
import { useI18n } from "../../hooks/useI18n";
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
  const { t } = useI18n();
  return (
    <Group gap="xs" wrap="nowrap" align="center">
      <NumberInput
        aria-label={t("labelMinWidth")}
        value={minWidth}
        placeholder="W"
        onChange={(val) => onChange({ minWidth: Number(val) })}
        size="xs"
        w={70}
        min={0}
        max={9999}
        allowNegative={false}
        variant="filled"
        styles={{ input: { textAlign: "center" } }}
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
          color={resolutionMode === "or" ? "brand" : "teal"}
          px={8}
          h={30}
        >
          <Text size="10px" fw={900}>
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
        w={70}
        min={0}
        max={9999}
        allowNegative={false}
        variant="filled"
        styles={{ input: { textAlign: "center" } }}
      />
      <Text size="xs" c="dimmed" fw={500} visibleFrom="xs">
        px
      </Text>
    </Group>
  );
};

export const ResolutionGroup = memo(ResolutionGroupBase);
export default ResolutionGroup;
