import React, { useMemo } from "react";
import { t, getLocale, setLocale } from "../../core/utils/i18n";
import { I18nContext } from "./I18nContext";
import { getFontStackByLocale } from "../theme";

export const I18nProvider: React.FC<{
  language: string;
  children: React.ReactNode;
}> = ({ language, children }) => {
  // 分离副作用：通知非 React 层全局变更，并动态应用自适应字体栈
  React.useEffect(() => {
    setLocale(language);

    const currentLocale = language === "auto" ? getLocale() : language;
    const dynamicFont = getFontStackByLocale(currentLocale);

    // 1. 设置到 html/body 上以适配 Sidepanel、网页沙盒及常规页面
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty("--imaget-font-family", dynamicFont);

      // 2. 为 Shadow DOM 内部的环境提供渐进式检测，动态写入对应的插件根容器中
      const container = document.querySelector(".imaget-extension-container");
      if (container instanceof HTMLElement) {
        container.style.setProperty("--imaget-font-family", dynamicFont);
      }

      try {
        const shadowRoots = Array.from(document.querySelectorAll("*"))
          .map((el) => el.shadowRoot)
          .filter((sr): sr is ShadowRoot => !!sr);

        for (const sr of shadowRoots) {
          const shadowContainer = sr.querySelector(".imaget-extension-container");
          if (shadowContainer instanceof HTMLElement) {
            shadowContainer.style.setProperty("--imaget-font-family", dynamicFont);
          }
        }
      } catch {
        // 忽略可能存在的解析异常
      }
    }
  }, [language]);

  // 构建纯净的 Context Value，强绑定当前语境，无视底层 forcedLocale 的延迟
  const value = useMemo(() => {
    const currentLocale = language === "auto" ? getLocale() : language;
    return {
      t: (key: string, sub?: string | string[]) => t(key, sub, currentLocale),
      locale: currentLocale,
    };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};
