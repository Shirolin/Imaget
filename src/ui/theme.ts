import { createTheme } from "@mantine/core";

// 基础西文核心后备栈（用于 Outfit 加载失败或未覆盖特殊符号时的优雅降级，防止直接掉入中日韩的英文字形）
const WESTERN_FALLBACK =
  "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial";

// 纯西文字体栈
export const EN_FONT_STACK = `Outfit, ${WESTERN_FALLBACK}, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'`;

// 简体中文最佳字体栈 (微软雅黑、平方-简 优先)
export const ZH_CN_FONT_STACK = `Outfit, ${WESTERN_FALLBACK}, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Source Han Sans SC', 'Noto Sans CJK SC', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'`;

// 繁体中文最佳字体栈 (微软正黑、平方-繁 优先)
export const ZH_TW_FONT_STACK = `Outfit, ${WESTERN_FALLBACK}, 'PingFang TC', 'Hiragino Sans GB', 'Microsoft JhengHei', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'`;

// 日语最佳字体栈 (Yu Gothic UI 现代游黑体、冬青黑优先，拦截中文污染，Meiryo 兜底)
export const JA_FONT_STACK = `Outfit, ${WESTERN_FALLBACK}, 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic UI', 'Yu Gothic', Meiryo, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'`;

// 韩语最佳字体栈 (Apple SD Gothic Neo、Malgun Gothic 优先)
export const KO_FONT_STACK = `Outfit, ${WESTERN_FALLBACK}, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Nanum Gothic', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'`;

/**
 * 根据 Locale 动态获取最完美的字体栈
 */
export const getFontStackByLocale = (locale: string): string => {
  switch (locale) {
    case "zh_CN":
      return ZH_CN_FONT_STACK;
    case "zh_TW":
      return ZH_TW_FONT_STACK;
    case "ja":
      return JA_FONT_STACK;
    case "ko":
      return KO_FONT_STACK;
    default:
      return EN_FONT_STACK;
  }
};

// 精简 Mantine Theme 里的兜底，冗余的降级栈完全由运行时 JS 控制，以极大地减少编译生成的 CSS 体积
export const FONT_STACK =
  "var(--imaget-font-family, system-ui, -apple-system, sans-serif)";

export const theme = createTheme({
  fontFamily: FONT_STACK,
  primaryColor: "brand",
  colors: {
    brand: [
      "#E0FBFF",
      "#B0F2F7",
      "#81E9F0",
      "#51DFF8",
      "#22D6F1",
      "#04E6F9",
      "#00C6D7",
      "#00A6B5",
      "#008693",
      "#006671",
    ],
  },
  defaultRadius: "md",
  cursorType: "pointer",
  components: {
    Card: {
      defaultProps: {
        radius: "md",
        shadow: "sm",
      },
    },
    Button: {
      defaultProps: {
        radius: "md",
      },
    },
    ActionIcon: {
      defaultProps: {
        radius: "md",
      },
    },
    Modal: {
      defaultProps: {
        overlayProps: {
          backgroundOpacity: 0.65,
        },
        padding: "xl",
        radius: "lg",
      },
    },
    Overlay: {
      defaultProps: {
        backgroundOpacity: 0.65,
      },
    },
    TextInput: {
      defaultProps: {
        variant: "filled",
      },
    },
    Autocomplete: {
      defaultProps: {
        variant: "filled",
      },
    },
    Select: {
      defaultProps: {
        variant: "filled",
      },
    },
    MultiSelect: {
      defaultProps: {
        variant: "filled",
      },
    },
    NumberInput: {
      defaultProps: {
        variant: "filled",
      },
    },
  },
});
