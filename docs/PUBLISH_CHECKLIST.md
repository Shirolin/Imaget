# Imaget 上架 Chrome 网上应用店 (CWS) 检查清单

本文档汇总了 **Imaget** 扩展在提交至 Chrome Web Store 审核前需完成的技术与合规性准备工作。

---

## 1. Manifest 关键字段完善 (manifest.json)
- [x] **元数据补充**:
  - `author`: 填写开发者或组织名称。
  - `homepage_url`: 建议填写 GitHub 项目主页或产品官网。
  - `short_name`: 限制在 12 个字符以内，用于浏览器 UI 显示。
- [x] **版本号同步**: 确保与 `package.json` 保持一致（目前已通过插件自动同步）。
- [x] **图标声明**: 确保 `icons` 字段配置了所有必需尺寸（已在 manifest.json 中配置 16, 48, 128）。

## 2. 图标资源准备 (Icons)
Chrome 商店要求必须提供以下尺寸的 **PNG** 格式图标：
- [x] **16x16**: 浏览器侧边栏/收藏夹 (`icon-16.png`)。
- [x] **32x32**: Windows 任务栏 (`favicon-32x32.png`)。
- [x] **48x48**: 扩展管理页面 (`icon-48.png`)。
- [x] **128x128**: **商店展示及安装提示 (必填)** (`icon-128.png`)。

> **当前状态**: 图标文件已就位并已在 Manifest 中引用。

## 3. 权限最小化审查 (Permissions)
CWS 审核极其看重“单一用途原则”和“权限最小化”：
- [x] **Host Permissions 说明**: 已在 `marketing/store-assets/REVIEW_JUSTIFICATION.md` 中准备好解释。
- [x] **Permissions 列表检查**:
  - `downloads`: 用于批量保存。
  - `activeTab`: 确保交互权限。
  - `storage`: 用于保存设置。
  - `contextMenus`: 用于右键导出。
  - `sidePanel`: 侧边栏交互核心。

## 4. 国际化与描述 (i18n)
- [x] **多语言覆盖**: `public/_locales/` 下 14 个语言目录（en, zh_CN, zh_TW, ja, ko, de, fr, es, pt_BR, tr, uk, ru, it, id）各含 56 个键，其中 `extName` 与 `extDesc` 供 manifest 的 `__MSG_*__` 占位符使用。
- [x] **应用内文案**: `src/locales/` 下 14 个语言文件键集与 `en` 基线完全一致（各 178 键），由 `src/core/utils/__tests__/i18n-coverage.test.ts` 守护。
- [x] **多语言应用店描述**: 已核实线上三个文案字段的来源（2026-09-18，用商店搜索页定位到真实 ID `kjnhapjhnhlilcngmhggiaaljddadjek`，并以 en / de 两个语言交叉验证）：
  - **名称 (Name)** ← `public/_locales/<code>/messages.json` 的 `extName`（经 manifest 的 `__MSG_extName__` 解析）
  - **摘要 (Summary)** ← 同一文件的 `extDesc`
  - **说明 (Description)** ← `marketing/design-source/descriptions.md`（长文式：`▎` emoji 分节 + `▶`/🔍 条目）
- [x] **已清理的旧稿**: 此前 `marketing/store-assets/STORE_DESCRIPTION.<code>.md`（14 个要点式旧稿，最后更新 2026-04-23）**不是线上文案**，已于 2026-09-18 删除以免与 `descriptions.md` 混淆（其中 10 个旧语言版本可从 git 历史找回）。**商店说明一律以 `marketing/design-source/descriptions.md` 为准。**

## 5. 法律与合规性 (Compliance)
- [x] **隐私政策 (Privacy Policy)**: 已在 `docs/PRIVACY.md` 创建。提交时需提供公开 URL（如 GitHub Pages 链接）。
- [ ] **隐私声明准备**: 在开发者后台勾选“不收集用户数据”的声明。

## 6. 商店展示素材 (Promotional Assets)
在 Chrome 开发者控制台上传时需要：
- [ ] **屏幕截图 (Screenshots)**: 已在 `marketing/screenshots/` 准备，需确认尺寸符合 1280x800 或 640x400。
- [x] **宣传瓷砖图 (Promotional Tile)**: 440x280 PNG 已就位。
- [x] **详细说明 (Long Description)**: 线上使用 `marketing/design-source/descriptions.md`（已核实，见第 4 节）。14 个语言均已备齐。

---

## 7. 最终构建与验证
- [x] **生产环境构建**: 执行 `npm run build` 已成功。
- [x] **离线包测试**: `dist` 目录构建产物已通过 Lint 和类型检查。
- [x] **Zip 打包**: `releases/new-imaget-v1.0.0.zip` 已生成。
