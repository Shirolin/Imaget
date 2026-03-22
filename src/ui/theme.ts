import { createTheme } from "@mantine/core";

export const FONT_STACK =
  'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "PingFang SC", "Hiragino Sans", "Microsoft YaHei", "Hiragino Kaku Gothic ProN", "Meiryo", "Malgun Gothic", "Microsoft JhengHei", "PingFang TC"';

export const theme = createTheme({
  fontFamily: FONT_STACK,
  // 可以在这里添加更多全局样式配置
});
