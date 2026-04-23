# Chrome Web Store Review Justification

This document provides detailed justification for the permissions requested by **Imaget** to ensure compliance with the Chrome Web Store's **Single Purpose** and **Permission Minimization** policies.

## Extension Overview
**Single Purpose**: A utility for users to discover, preview, and batch-download image assets from the current active webpage.

---

## Permission Justifications

### 1. `host_permissions: ["<all_urls>"]` (Broad Host Permission)
*   **Necessity**: Imaget functions as a general-purpose image discovery tool. Users expect it to be functional on any website where images are displayed.
*   **Usage**: The permission is used to inject a content script that identifies `<img>` tags, background-images, and CSS-referenced assets. It also allows the extension to bypass cross-origin restrictions when resolving image dimensions or fetching metadata for previewing purposes.
*   **Constraint**: The extension only acts upon user activation and does not monitor browsing history or transmit data.

### 2. `permissions: ["downloads"]`
*   **Usage**: Required to programmatically trigger the download of multiple image files selected by the user, providing the core "batch download" functionality.

### 3. `permissions: ["sidePanel"]`
*   **Usage**: Used to host the extension's UI in the browser's side panel, ensuring a persistent and non-intrusive user experience that doesn't close when the user interacts with the main page content.

### 4. `permissions: ["storage"]`
*   **Usage**: Used exclusively to store user-defined preferences (e.g., filter defaults, download path patterns).

### 5. `permissions: ["activeTab"]`
*   **Usage**: Used to ensure the extension has permission to interact with the currently focused tab upon user invocation.

---

## Compliance and Data Safety
*   **Manifest V3**: This extension fully adheres to Manifest V3 standards.
*   **No Remote Code**: No external scripts or remote code are fetched or executed. All logic is bundled locally within the extension package.
*   **No Data Collection**: The extension does not collect, store, or transmit any user data, personal information, or browsing history. All processing occurs locally on the user's machine.
*   **Open Source**: The project is open-source for transparency: https://github.com/Shirolin/New-Imaget
