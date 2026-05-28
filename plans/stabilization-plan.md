# 回归与稳定化分析报告 (Stabilization Analysis)

## 1. 现状反思 (Current State Analysis)
`feat/optimization` 分支最初的目标是优化代码结构（参考 `optimization-plan.md`）。然而，在修复近期遇到的几个运行时错误时，引入了“过度工程化”的临时修复，导致代码复杂度增加，且未能真正命中问题的根本原因。

### 问题 A：手动 Base64 转换导致的性能灾难
- **错误修复**：为了解决 `Maximum call stack size exceeded`，我们编写了 16KB 分片的手动 JS 循环 (`String.fromCharCode.apply`)。
- **根本缺陷**：JS 层面的密集字符串拼接和二进制遍历极度消耗 CPU 且容易造成内存抖动。
- **原生解法**：浏览器底层提供的 `FileReader.readAsDataURL()` 或 `Blob` 转换是异步且内存安全的。完全不需要手写分片循环。

### 问题 B：Twitter 上的 `createObjectURL` 崩溃
- **错误日志**：`TypeError: URL.createObjectURL is not a function`。
- **根本缺陷**：这个错误发生在注入到 Twitter 页面的 Content Script 中。Twitter 为了防止媒体被抓取，**故意在全局破坏/重写了 `window.URL.createObjectURL`**。
- **导致后果**：我们在 `ImageConverter` 中编写的 <img> 兜底方案依赖了 `createObjectURL`，所以在 Twitter 页面遇到无法处理的图片（如 SVG）时，兜底方案会再次引发崩溃。

## 2. 稳定化重构计划 (Stabilization Plan)

我们必须删除那些脆弱的 Hack 代码，拥抱原生且抗干扰的 API 方案。

### 阶段一：重构通信管道 (移除手动循环)
**目标文件**: `src/core/adapters/extension.ts` & `src/entry/background.ts`
**动作**:
1. 删除 `Uint8Array` 遍历、分片、`String.fromCharCode` 和 `btoa` 的手写代码。
2. 引入 `FileReader.readAsDataURL(blob)`。在 `background.ts` 接收 fetch 数据后，直接将 Blob 送入 FileReader 生成 Data URL；在 `extension.ts` 发送前，也用 FileReader 提取 Base64。

### 阶段二：反劫持的 ImageConverter 兜底方案
**目标文件**: `src/core/utils/image-converter.ts`
**动作**:
1. 废弃兜底方案中的 `URL.createObjectURL(blob)`。
2. 替换为：使用 `FileReader.readAsDataURL(blob)` 获取安全的、不被拦截的数据流地址，然后赋值给 `imgElement.src`。
3. 这不仅完美支持 SVG，还能彻底免疫 Twitter 的环境劫持。

### 阶段三：安全增强
- **动作**: 编写一个全局的 `getCleanCreateObjectURL` 工具函数（通过构造沙盒 iframe 提取未经污染的 API），以备后续其他模块需要使用。

## 3. 预期收益
- **代码精简**：删除大量丑陋的分片处理逻辑。
- **性能飞跃**：依靠底层 C++ 实现的 DataURL 编码，处理 10MB 原图也不会卡顿。
- **终极防御**：彻底解决在 Twitter/X 等强反爬站点上的环境被破坏问题。