import type { ImageItem, Settings } from "../../types";

/**
 * 文件名生成器：100% 对齐旧项目逻辑
 * 处理全量模板变量、特殊字符过滤以及路径拼装
 */
export function generateFilename(
  img: ImageItem,
  settings: Settings,
  options: { index: number; total: number },
  extension?: string,
): string {
  const template =
    settings.fileSaving?.filenameTemplate ||
    "{page_title}_{date}_{time}_{index}";
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const day = now.getDate().toString().padStart(2, "0");
  const hour = now.getHours().toString().padStart(2, "0");
  const minute = now.getMinutes().toString().padStart(2, "0");
  const second = now.getSeconds().toString().padStart(2, "0");

  const dateStr = `${year}${month}${day}`;
  const timeStr = `${hour}${minute}${second}`;

  // 100% 对齐旧项目：原始文件名获取逻辑
  let originName = "image";
  if (img.url.startsWith("data:")) {
    originName = "data_image_" + img.id.slice(0, 4);
  } else {
    try {
      const urlObj = new URL(img.url);
      const pathname = urlObj.pathname;
      const basename = pathname.substring(pathname.lastIndexOf("/") + 1);
      // 移除扩展名并解码
      originName = basename.replace(/\.[^/.]+$/, "") || "image";
      originName = decodeURIComponent(originName);
      // 防止解析出过长的非法名称 (比如某些 base64 误判)
      if (originName.length > 100) originName = originName.slice(0, 100);
    } catch {
      /* ignore */
    }
  }

  const digits = options.total.toString().length;
  // Index 补零逻辑对齐
  const indexStr = options.index.toString().padStart(Math.max(2, digits), "0");

  const sanitize = (str: string) => {
    return (str || "")
      .replace(/[\\/:*?"<>|\s\t\r\n\0]/g, "_") // 替换非法字符及所有空白符为下划线
      .replace(/_{2,}/g, "_") // 合并连续下划线
      .slice(0, 100); // 限制单部分长度
  };

  // 全量对齐模板变量 (Vars Map)
  const vars: Record<string, string> = {
    "{date}": dateStr,
    "{time}": timeStr,
    "{year}": year,
    "{month}": month,
    "{day}": day,
    "{hour}": hour,
    "{minute}": minute,
    "{second}": second,
    "{title}": sanitize(img.pageTitle || document.title || "Untitled"),
    "{id}": img.id.slice(0, 8),
    "{index}": indexStr,
    "{page_title}": sanitize(img.pageTitle || document.title || "NoTitle"),
    "{page_url}": img.pageUrl || window.location.href,
    "{host}": (() => {
      try {
        return new URL(img.pageUrl || window.location.href).hostname;
      } catch {
        return window.location.hostname;
      }
    })(),
    "{domain}": (() => {
      try {
        return new URL(img.pageUrl || window.location.href).hostname;
      } catch {
        return window.location.hostname;
      }
    })(),
    "{origin}": sanitize(originName),
  };

  let name = template;
  for (const [v, val] of Object.entries(vars)) {
    // 100% 复刻：使用 split/join 进行全量替换，不使用易错的正则
    name = name.split(v).join(val);
  }

  // 非法字符过滤 (对齐 Windows/macOS 兼容性)
  // 并去除首尾空格，防止 Chrome 拒绝带有空格的文件名
  name = name.replace(/[\\/:*?"<>|]/g, "_").trim();

  // 兜底：如果文件名被过滤空了，给个默认名
  if (!name) name = "image_" + options.index;

  // 获取后缀名逻辑
  let ext = "png";
  if (extension) {
    ext = extension.replace(".", "").toLowerCase();
  } else if (img.url.startsWith("data:")) {
    ext =
      img.format.toLowerCase() !== "unknown" ? img.format.toLowerCase() : "png";
  } else {
    const urlExt = img.url.split(".").pop()?.split(/[?#]/)[0]?.toLowerCase();
    ext =
      urlExt && urlExt.length <= 5
        ? urlExt
        : img.format.toLowerCase() !== "unknown"
          ? img.format.toLowerCase()
          : "png";
  }
  if (ext === "jpeg") ext = "jpg";

  let finalPath = `${name}.${ext}`;

  // --- 100% 对齐旧项目：子文件夹变量替换与路径拼装 ---
  const subfolder = settings.fileSaving?.subfolder;
  if (subfolder) {
    let cleanSub = subfolder;
    for (const [v, val] of Object.entries(vars)) {
      cleanSub = cleanSub.split(v).join(val);
    }
    // 清洗子文件夹路径中的非法字符，并去掉首尾斜杠及空格
    cleanSub = cleanSub
      .replace(/[\\:*?"<>|]/g, "_")
      .split("/")
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .join("/");

    if (cleanSub) {
      finalPath = `${cleanSub}/${finalPath}`;
    }
  }

  return finalPath;
}
