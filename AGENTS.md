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
* 严禁在 Shadow DOM 内直接引用外部不可达的第三方 CSS，除非在 Sidepanel 且通过官方扩展方式。
* 严禁对所有语言硬编码相同的静态回退字体栈，避免 CJK 汉字冲突。
