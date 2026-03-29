# Imaget 上架 Chrome 网上应用店 (CWS) 检查清单

本文档汇总了 **Imaget** 扩展在提交至 Chrome Web Store 审核前需完成的技术与合规性准备工作。

---

## 1. Manifest 关键字段完善 (manifest.json)
- [x] **元数据补充**:
  - `author`: 填写开发者或组织名称。
  - `homepage_url`: 建议填写 GitHub 项目主页或产品官网。
  - `short_name`: 限制在 12 个字符以内，用于浏览器 UI 显示。
- [x] **版本号同步**: 确保与 `package.json` 保持一致（目前已通过插件自动同步）。
- [ ] **图标声明**: 确保 `icons` 字段配置了所有必需尺寸（见下文）。

## 2. 图标资源准备 (Icons)
Chrome 商店要求必须提供以下尺寸的 **PNG** 格式图标：
- [ ] **16x16**: 浏览器侧边栏/收藏夹。
- [ ] **32x32**: Windows 任务栏。
- [ ] **48x48**: 扩展管理页面。
- [ ] **128x128**: **商店展示及安装提示 (必填)**。

> **当前状态**: 需将现有的 `favicon.svg` 转换为上述尺寸的 PNG 并放入 `public/icons/` 目录。

## 3. 权限最小化审查 (Permissions)
CWS 审核极其看重“单一用途原则”和“权限最小化”：
- [ ] **Host Permissions**: 目前使用 `"<all_urls>"`。需准备好在开发者后台解释为何需要全量网页嗅探权限。
- [ ] **Permissions 列表**:
  - `downloads`: 用于批量保存。
  - `activeTab`: 建议保留，降低初次安装的权限敏感度。
  - [x] **scripting**: 已检查，项目中未使用，已从 Manifest 中移除。
  - `contextMenus`: 用于右键导出。

## 4. 国际化与描述 (i18n)
- [x] **多语言覆盖**: 确保 `public/_locales/` 下的 `en` 和 `zh_CN` 包含：
  - `extName`: 扩展名称。
  - `extDesc`: 简练且吸引人的功能描述（建议包含关键词提高搜索权重）。
- [x] **占位符检查**: 确保没有硬编码的字符串遗留在 Manifest 中。

## 5. 法律与合规性 (Compliance)
- [ ] **隐私政策 (Privacy Policy)**:
  - 必须提供一个公开可访问的 URL。
  - 需明确声明：不收集、不上传、不转售任何用户个人数据。
- [ ] **单一用途描述**: 准备一段话，清晰说明 Imaget 的核心功能（图片嗅探与下载）。

## 6. 商店展示素材 (Promotional Assets)
在 Chrome 开发者控制台上传时需要：
- [ ] **屏幕截图 (Screenshots)**: 至少 1 张，推荐 4-5 张（1280x800 或 640x400 PNG）。
- [ ] **宣传瓷砖图 (Promotional Tile)**: 440x280 PNG。
- [ ] **详细说明 (Long Description)**: 结构化的功能介绍、更新日志和支持链接。

---

## 💡 提示：如何测试生产包？
在提交前，请务必执行：
1. `npm run build` 生成最终的 `dist`。
2. 在 Chrome 扩展程序页面点击 **“加载解压的扩展程序”**，选择 `dist` 目录进行最后的真机测试。
3. 检查是否有 `eval()` 报错或 CSP 违规警告。
