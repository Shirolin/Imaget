import React from "react";
import ReactDOM from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import App from "../ui/App";
import { theme, getFontStackByLocale } from "../ui/theme";
import { getLocale, resolveLocale } from "../core/utils/i18n";
import "@mantine/core/styles.css";

// 动态计算首屏语言并设定，优先采用扩展原生 chrome.i18n API，防止首屏加载时的字体抖动（FOIT / FOUT）
// 语言解析统一委托给 resolveLocale，避免与 core/utils/i18n 的支持列表出现第二份副本
const getInitialLocale = (): string =>
  typeof chrome !== "undefined" && chrome.i18n?.getUILanguage
    ? resolveLocale(chrome.i18n.getUILanguage())
    : getLocale();

const currentLocale = getInitialLocale();
const dynamicFont = getFontStackByLocale(currentLocale);
if (typeof document !== "undefined") {
  document.documentElement.style.setProperty(
    "--imaget-font-family",
    dynamicFont,
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider theme={theme} forceColorScheme="dark">
      <App />
    </MantineProvider>
  </React.StrictMode>,
);
