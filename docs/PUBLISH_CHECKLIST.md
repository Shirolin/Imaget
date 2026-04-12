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
- [ ] **Host Permissions 说明**: 准备好在开发者后台解释为何需要 `"<all_urls>"` 权限（用于通用网页图片嗅探）。
- [ ] **Permissions 列表检查**:
  - `downloads`: 用于批量保存。
  - `activeTab`: 降低初次安装的权限敏感度。
  - `storage`: 用于保存设置。
  - `contextMenus`: 用于右键导出。
  - `sidePanel`: 侧边栏交互核心。

## 4. 国际化与描述 (i18n)
- [x] **多语言覆盖**: `public/_locales/` 下的 `en` 和 `zh_CN` 已包含 `extName` 和 `extDesc`。
- [ ] **多语言应用店描述**: 准备好英文和中文的商店详细介绍文案。

## 5. 法律与合规性 (Compliance)
- [x] **隐私政策 (Privacy Policy)**: 已在 `docs/PRIVACY.md` 创建。提交时需提供公开 URL。
- [ ] **隐私声明准备**: 在开发者后台勾选“不收集用户数据”的声明。

## 6. 商店展示素材 (Promotional Assets)
在 Chrome 开发者控制台上传时需要：
- [ ] **屏幕截图 (Screenshots)**: 至少 1 张，推荐 4-5 张（1280x800 或 640x400 PNG）。需展示侧边栏效果和图片网格。
- [ ] **宣传瓷砖图 (Promotional Tile)**: 440x280 PNG。
- [ ] **详细说明 (Long Description)**: 包含功能列表、支持的特殊站点（Pixiv, Twitter 等）以及开源说明。

---

## 7. 最终构建与验证
- [ ] **生产环境构建**: 执行 `npm run build`。
- [ ] **离线包测试**: 在 Chrome 中加载 `dist` 目录，确保没有 `eval()` 或 CSP 违规。
- [ ] **Zip 打包**: 确保上传的是由构建脚本生成的标准 Zip 包。
