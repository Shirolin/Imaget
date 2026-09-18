# Chrome Web Store Review Justification

This document provides detailed justification for the permissions requested by **Imaget** to ensure compliance with the Chrome Web Store's **Single Purpose** and **Permission Minimization** policies.

## Extension Overview
**Single Purpose**: A utility for users to discover, preview, and batch-download image assets from the current active webpage.

---

## Permission Justifications

### 1. `host_permissions: ["http://*/*", "https://*/*"]` (HTTP(S) Host Permissions)
*   **Necessity**: Imaget is a general-purpose image discovery and batch-download tool. Users expect it to function on HTTP and HTTPS websites where images are displayed.
*   **Usage**: Used to inject content scripts to identify <img> tags, background-images, and CSS assets. It also enables the extension to bypass cross-origin (CORS) restrictions when resolving image dimensions or fetching metadata for high-quality previews.

### 2. `permissions: ["downloads"]`
*   **Usage**: Required to programmatically trigger the download of multiple image files selected by the user, providing the core "batch download" functionality.

### 3. `permissions: ["sidePanel"]`
*   **Usage**: Used to host the extension's UI in the browser's side panel, providing a persistent and non-intrusive workspace that doesn't close when interacting with the main page.

### 4. `permissions: ["contextMenus"]`
*   **Usage**: Used to provide quick-access actions via the right-click menu, allowing users to "Quick Save" a specific image in various formats (WebP/PNG/JPG) or quickly open the Imaget dashboard.

### 5. `permissions: ["storage"]`
*   **Usage**: Used exclusively to store user-defined preferences (e.g., filter defaults, download path patterns).

### 6. `permissions: ["activeTab"]`
*   **Usage**: Used to ensure the extension has temporary permission to interact with the currently focused tab upon user invocation.

### 7. `permissions: ["declarativeNetRequest"]`
*   **Necessity**: A small number of image CDNs enforce hotlink protection: they reject requests whose `Referer` / `Origin` headers do not match their own site, even for images the user can already see rendered on the page. Without the ability to normalise those two headers, the extension cannot retrieve the image bytes the user has explicitly asked to download.
*   **Usage**: Used exclusively to **modify two request headers** (`Referer`, `Origin`) for image and XHR requests, scoped to three specific CDN hosts:
    | Target host | CDN | Header action |
    |---|---|---|
    | `sinaimg.cn` | Weibo | set `Referer` to `https://weibo.com/`, remove `Origin` |
    | `i.pximg.net` | Pixiv | set `Referer` to `https://www.pixiv.net/`, remove `Origin` |
    | `redd.it` | Reddit | set `Origin` and `Referer` to `https://www.reddit.com/` |
*   **Scope and limits**: Rules are restricted to `resourceTypes: ["image", "xmlhttprequest"]` only. The extension performs **no request blocking, no redirection, and no header inspection** — the header values it writes are the public site origins listed above, not user data. Rules are registered at runtime via `chrome.declarativeNetRequest.updateDynamicRules()`; no static `rule_resources` ruleset file is shipped, so the manifest declares no `declarative_net_request.rule_resources` entry.
*   **Reference**: `src/entry/background.ts` → `setupDeclarativeNetRequestRules()`.

---

## Compliance and Data Safety
*   **Manifest V3**: This extension fully adheres to Manifest V3 standards.
*   **No Remote Code**: **IMPORTANT: Select "No" in the developer dashboard.** No external scripts or remote code are fetched or executed. All logic is bundled locally within the extension package.
*   **No Data Collection**: The extension does not collect, store, or transmit any user data, personal information, or browsing history. All processing occurs locally on the user's machine.
*   **Open Source**: The project is open-source for transparency: https://github.com/Shirolin/Imaget

