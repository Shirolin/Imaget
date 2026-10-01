import React, { useMemo } from "react";
import { t, getLocale, setLocale } from "../../core/utils/i18n";
import { I18nContext } from "./I18nContext";

export const I18nProvider: React.FC<{
  language: string;
  children: React.ReactNode;
}> = ({ language, children }) => {
  // 通知非 React 层全局语言变更；宿主 DOM 适配（字体变量注入）由各 entry
  // 层通过 core/utils/i18n 的 onLocaleChange 订阅完成，UI 不触碰宿主文档
  React.useEffect(() => {
    setLocale(language);
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
