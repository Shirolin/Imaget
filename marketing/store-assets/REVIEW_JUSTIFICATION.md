# Chrome Web Store Review Justification

This document provides detailed justification for the permissions requested by **Imaget** to ensure compliance with the Chrome Web Store's **Single Purpose** and **Permission Minimization** policies.

## Extension Overview
**Single Purpose**: A utility for users to discover, preview, and batch-download image assets from the current active webpage.

---

## Permission Justifications

### 1. `host_permissions: ["<all_urls>"]` (Broad Host Permission)
*   **Necessity**: Imaget is a general-purpose image discovery and batch-download tool. Users expect it to function on any website where images are displayed.
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

---

## Compliance and Data Safety
*   **Manifest V3**: This extension fully adheres to Manifest V3 standards.
*   **No Remote Code**: **IMPORTANT: Select "No" in the developer dashboard.** No external scripts or remote code are fetched or executed. All logic is bundled locally within the extension package.
*   **No Data Collection**: The extension does not collect, store, or transmit any user data, personal information, or browsing history. All processing occurs locally on the user's machine.
*   **Open Source**: The project is open-source for transparency: https://github.com/Shirolin/Imaget

