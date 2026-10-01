import React from "react";
import ReactDOM from "react-dom/client";
import "@mantine/core/styles.css";
import DevApp from "./ui/DevApp";
import { getFontStackByLocale } from "./ui/theme";
import { getLocale, onLocaleChange } from "./core/utils/i18n";
import { injectBrandFontFace } from "./core/utils/brand-font";

injectBrandFontFace();

// 宿主 DOM 适配归 entry 层：首屏与语言切换时同步字体变量
const applyFont = (locale: string) => {
  document.documentElement.style.setProperty(
    "--imaget-font-family",
    getFontStackByLocale(locale),
  );
};
applyFont(getLocale());
onLocaleChange(applyFont);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DevApp />
  </React.StrictMode>,
);
