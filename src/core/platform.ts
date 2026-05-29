import { WebAdapter } from "./adapters/web";
import { ExtensionAdapter } from "./adapters/extension";
import type { IPlatformAdapter } from "./adapters/interface";

const isExtension = typeof chrome !== "undefined" && chrome.runtime?.id;
export const platformAdapter: IPlatformAdapter = isExtension
  ? new ExtensionAdapter()
  : new WebAdapter();
