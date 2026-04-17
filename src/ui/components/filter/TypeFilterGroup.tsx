import React, { memo } from "react";
import { Group, Text } from "@mantine/core";
import { IconPhoto, IconPhotoOff } from "@tabler/icons-react";
import { useI18n } from "../../hooks/useI18n";
import type { ImageFormat, FilterOptions } from "../../../types";
import { PortalMultiSelect } from "../common/PortalSelect";

interface TypeFilterGroupProps {
  allowedFormats: ImageFormat[];
  excludeFormats: ImageFormat[];
  onChange: (updates: Partial<FilterOptions>) => void;
  portalNode: HTMLDivElement | null;
}

const formats: ImageFormat[] = [
  "PNG",
  "JPG",
  "WEBP",
  "SVG",
  "GIF",
  "AVIF",
  "BMP",
  "ICO",
  "TIFF",
  "HEIC",
  "HEIF",
  "DPG",
];

const TypeFilterGroupBase: React.FC<TypeFilterGroupProps> = ({
  allowedFormats,
  excludeFormats,
  onChange,
  portalNode,
}) => {
  const { t } = useI18n();
  interface FormatPillProps {
    value: string;
    onRemove: () => void;
  }

  const renderFormatPill = (
    values: ImageFormat[],
    { value }: FormatPillProps,
  ) => {
    if (values[0] !== value) return null;
    return (
      <Group gap={4} wrap="nowrap" align="center">
        <Text size="xs" fw={600} c="brand.4">
          {value}
        </Text>
        {values.length > 1 && (
          <Text size="10px" fw={800} c="dimmed">
            +{values.length - 1}
          </Text>
        )}
      </Group>
    );
  };

  const inputStyles = {
    input: {
      height: "30px",
      minHeight: "30px",
      paddingLeft: "30px",
      overflow: "hidden",
    },
    pillsList: {
      flexWrap: "nowrap" as const,
      maxHeight: "24px",
      overflow: "hidden",
    },
    pill: { height: "20px", maxWidth: "60px" },
  };

  // 核心修复：阶梯式响应宽度策略
  const sharedProps = {
    flex: {
      base: "1 0 100%", // 单列
      xs: "1 0 calc(50% - 10px)", // 双列
      md: 1, // 四列
    },
    miw: 0,
    size: "xs" as const,
    variant: "filled" as const,
    styles: inputStyles,
  };

  return (
    <>
      <PortalMultiSelect
        {...sharedProps}
        placeholder={t("filterType")}
        leftSection={
          <IconPhoto size={14} color="var(--mantine-color-dimmed)" />
        }
        data={formats}
        value={allowedFormats}
        onChange={(val) => onChange({ allowedFormats: val as ImageFormat[] })}
        clearable
        portalNode={portalNode}
        renderPill={(props: FormatPillProps) =>
          renderFormatPill(allowedFormats, props)
        }
      />

      <PortalMultiSelect
        {...sharedProps}
        placeholder={t("filterExcludeType")}
        leftSection={
          <IconPhotoOff size={14} color="var(--mantine-color-red-6)" />
        }
        data={formats}
        value={excludeFormats}
        onChange={(val) => onChange({ excludeFormats: val as ImageFormat[] })}
        clearable
        portalNode={portalNode}
        renderPill={(props: FormatPillProps) =>
          renderFormatPill(excludeFormats, props)
        }
      />
    </>
  );
};

export const TypeFilterGroup = memo(TypeFilterGroupBase);
export default TypeFilterGroup;
