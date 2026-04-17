import React, { createContext, useContext, useMemo } from "react";
import { t, getLocale } from "../../core/utils/i18n";

interface I18nContextValue {
  t: typeof t;
  locale: string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<{
  language: string;
  children: React.ReactNode;
}> = ({ language, children }) => {
  // 当 language 改变时，Context 的 value 会刷新，从而触发所有 Consumer 重绘
  const value = useMemo(
    () => ({
      t,
      locale: language === "auto" ? getLocale() : language,
    }),
    [language],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    // 降级处理，如果在 Provider 之外使用，依然返回静态 t
    return { t, locale: getLocale() };
  }
  return context;
};
