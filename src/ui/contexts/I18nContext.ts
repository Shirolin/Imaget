import { createContext } from "react";
import { t } from "../../core/utils/i18n";

export interface I18nContextValue {
  t: typeof t;
  locale: string;
}

export const I18nContext = createContext<I18nContextValue | null>(null);
