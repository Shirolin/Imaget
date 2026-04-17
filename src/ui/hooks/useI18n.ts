import { useContext } from "react";
import { I18nContext } from "../contexts/I18nContext";
import { t, getLocale } from "../../core/utils/i18n";

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    // 降级处理，如果在 Provider 之外使用，依然返回静态 t
    return { t, locale: getLocale() };
  }
  return context;
};
