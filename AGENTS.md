# Imaget Project Constitution (宪法)

## 技术栈与版本约束
* **Core**: React 19, TypeScript
* **UI**: Mantine v8, Shadow DOM
* **Chrome Extension**: Manifest V3

## 命名与编码规范
* **字体变量**: 使用 `--imaget-font-family` 作为多语言自适应字体的核心 CSS 变量。
* **多语言回退栈**:
  * 英文/西方: `Outfit`, `system-ui`
  * 简体中文: `PingFang SC`, `Microsoft YaHei`
  * 繁体中文: `PingFang TC`, `Microsoft JhengHei`
  * 日语: `Hiragino Sans`, `Meiryo`
  * 韩语: `Apple SD Gothic Neo`, `Malgun Gothic`

## 禁止模式
* 严禁混合 DOM 抓取逻辑与 `src/ui` 组件。
  * 边界条款：宿主 DOM 的探测与适配（shadow 容器查找、CSS 变量注入等）归 `src/entry` 层；`src/ui` 只消费 CSS 变量与 React context，不得反向查询宿主文档（`document.querySelector` / 遍历 shadowRoot 等）。
  * `src/ui` 允许调用 `src/core` 暴露的抓取器 API 做编排（如 `new Sniffer()`），抓取实现本体必须留在 `src/core`。
* 严禁在 Shadow DOM 内直接引用外部不可达的第三方 CSS，除非在 Sidepanel 且通过官方扩展方式。
  * 字体可达性：字体栈中引用的品牌字体（如 `Outfit`）在页面内 Shadow DOM 场景必须满足其一：随扩展打包自托管（`@font-face` 指向 `chrome-extension://` 资源），或在代码注释中显式声明为渐进增强（宿主恰好提供则用，否则降级到回退栈）。禁止默认它可用。
* 严禁对所有语言硬编码相同的静态回退字体栈，避免 CJK 汉字冲突。
