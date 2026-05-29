import React from "react";
import ReactDOM from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import App from "../ui/App";
import { theme, getFontStackByLocale } from "../ui/theme";
import { getLocale } from "../core/utils/i18n";
import "@mantine/core/styles.css";

// 动态计算首屏语言并设定，优先采用扩展原生 chrome.i18n API，防止首屏加载时的字体抖动（FOIT / FOUT）
const getInitialLocale = (): string => {
  if (typeof chrome !== "undefined" && chrome.i18n?.getUILanguage) {
    const uiLang = chrome.i18n.getUILanguage().toLowerCase();
    if (uiLang.startsWith("zh")) {
      if (uiLang.includes("tw") || uiLang.includes("hk") || uiLang.includes("hant") || uiLang.includes("traditional")) {
        return "zh_TW";
      }
      return "zh_CN";
    }
    if (uiLang.startsWith("pt")) return "pt_BR";
    const supported = ["de", "en", "es", "fr", "ja", "ko", "tr"];
    for (const s of supported) {
      if (uiLang.startsWith(s)) return s;
    }
  }
  return getLocale();
};

const currentLocale = getInitialLocale();
const dynamicFont = getFontStackByLocale(currentLocale);
if (typeof document !== "undefined") {
  document.documentElement.style.setProperty("--imaget-font-family", dynamicFont);
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider theme={theme} forceColorScheme="dark">
      <App />
    </MantineProvider>
  </React.StrictMode>,
);
