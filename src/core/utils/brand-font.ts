// 宿主 DOM 适配归 entry 层：品牌字体 Outfit 的自托管 @font-face 注入。
// 字体文件位于 public/fonts/（SIL OFL 1.1，可变字体，覆盖 100-900 字重）。
// - 扩展环境（content script / sidepanel）：chrome-extension:// URL，
//   已在 manifest.json 的 web_accessible_resources 白名单中，不受宿主页面 CSP 限制。
// - dev 沙盒（vite）：public/ 按根路径直出 /fonts/*。

const OUTFIT_SOURCES = [
  {
    file: "outfit-latin.woff2",
    unicodeRange:
      "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD",
  },
  {
    file: "outfit-latin-ext.woff2",
    unicodeRange:
      "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF",
  },
];

const isExtension = typeof chrome !== "undefined" && !!chrome.runtime?.id;

const fontUrl = (file: string): string =>
  isExtension ? chrome.runtime.getURL(`fonts/${file}`) : `/fonts/${file}`;

export const getBrandFontFaceCss = (): string =>
  OUTFIT_SOURCES.map(
    ({ file, unicodeRange }) => `@font-face {
  font-family: 'Outfit';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url(${fontUrl(file)}) format('woff2');
  unicode-range: ${unicodeRange};
}`,
  ).join("\n");

/** 将品牌字体 @font-face 注入文档 head（sidepanel / dev 沙盒用）。 */
export const injectBrandFontFace = (): void => {
  if (typeof document === "undefined") return;
  const style = document.createElement("style");
  style.textContent = getBrandFontFaceCss();
  document.head.appendChild(style);
};
