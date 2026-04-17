import React, { useMemo } from "react";
import { t, getLocale } from "../../core/utils/i18n";
import { I18nContext } from "./I18nContext";

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
