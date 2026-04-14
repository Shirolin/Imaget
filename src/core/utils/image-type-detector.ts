import type { ImageFormat } from "../../types";

/**
 * ImageTypeDetector: 提供多维度的图片格式检测能力
 * 包含：URL 正则匹配、平台特定参数解析、MIME Type 映射、文件魔数识别
 */
export class ImageTypeDetector {
  /**
   * 从 URL 推断图片格式 (极速路径，支持带参数的 URL)
   */
  public static getFormatFromUrl(url: string | undefined | null): ImageFormat {
    if (!url) return "UNKNOWN";

    try {
      // 1. 标准路径：匹配常见图片后缀 (支持 ? # $ 结尾)
      const extMatch = url.match(
        /\.(jpg|jpeg|png|gif|webp|avif|bmp|ico|svg|tiff|tif|heic|heif|dpg)(\?|$|#)/i,
      );
      if (extMatch) {
        const ext = extMatch[1].toLowerCase();
        if (ext === "jpeg") return "JPG";
        if (ext === "tif") return "TIFF";
        return ext.toUpperCase() as ImageFormat;
      }

      // 2. 深度识别：社交/电商平台特定参数
      const urlObj = new URL(url, "http://localhost");
      const params = urlObj.searchParams;

      // 京东 DPG (img.360buyimg.com/.../img.jpg.dpg)
      if (url.includes("360buyimg.com") && url.toLowerCase().endsWith(".dpg")) {
        return "DPG";
      }

      // Twitter / X (pbs.twimg.com/.../id?format=xxx)
      if (url.includes("pbs.twimg.com") && params.has("format")) {
        const fmt = params.get("format")?.toLowerCase();
        if (fmt === "jpg" || fmt === "jpeg") return "JPG";
        return (fmt?.toUpperCase() as ImageFormat) || "UNKNOWN";
      }

      // 微信公众号 (mp.weixin.qq.com/.../id?wx_fmt=xxx&tp=webp)
      if (url.includes("mp.weixin.qq.com") || url.includes("mmbiz.qpic.cn")) {
        const tp = params.get("tp");
        if (tp === "webp") return "WEBP";
        const wxFmt = params.get("wx_fmt")?.toLowerCase();
        if (wxFmt === "jpeg" || wxFmt === "jpg") return "JPG";
        if (wxFmt === "png") return "PNG";
        if (wxFmt === "gif") return "GIF";
      }

      // Bilibili (hdslb.com/.../img.jpg@...webp)
      const biliMatch = url.match(/@.*?\.(webp|jpg|png|gif)/i);
      if (url.includes("hdslb.com") && biliMatch) {
        return biliMatch[1].toUpperCase() as ImageFormat;
      }

      // 淘宝 / 天猫 (img.alicdn.com/.../img.jpg_.webp)
      if (url.includes("alicdn.com") || url.includes("taobaocdn.com")) {
        const tmMatch = url.match(/_(\d+x\d+)?\.(webp|jpg|png|gif)/i);
        if (tmMatch) return tmMatch[2].toUpperCase() as ImageFormat;
      }
    } catch {
      // 容错处理
    }

    return "UNKNOWN";
  }

  /**
   * 从 Content-Type (MIME Type) 映射到 ImageFormat
   */
  public static getFormatFromMimeType(mimeType: string | null): ImageFormat {
    if (!mimeType) return "UNKNOWN";
    const type = mimeType.toLowerCase();
    if (type.includes("png")) return "PNG";
    if (type.includes("jpeg") || type.includes("jpg")) return "JPG";
    if (type.includes("webp")) return "WEBP";
    if (type.includes("gif")) return "GIF";
    if (type.includes("svg")) return "SVG";
    if (type.includes("avif")) return "AVIF";
    if (type.includes("bmp")) return "BMP";
    if (type.includes("tiff")) return "TIFF";
    if (type.includes("heic")) return "HEIC";
    if (type.includes("heif")) return "HEIF";
    if (type.includes("x-icon") || type.includes("vnd.microsoft.icon"))
      return "ICO";
    return "UNKNOWN";
  }

  /**
   * 通过二进制魔数检测图片的真实格式
   * @param buffer 图片数据的前 16 字节
   */
  public static getFormatFromMagicNumber(buffer: Uint8Array): ImageFormat {
    if (!buffer || buffer.length < 4) return "UNKNOWN";

    const hex = Array.from(buffer)
      .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
      .join(" ");

    // JPEG: FF D8 FF
    if (hex.startsWith("FF D8 FF")) return "JPG";

    // PNG: 89 50 4E 47
    if (hex.startsWith("89 50 4E 47")) return "PNG";

    // GIF: 47 49 46 38
    if (hex.startsWith("47 49 46 38")) return "GIF";

    // WebP: 52 49 46 46 (RIFF) ... 57 45 42 50 (WEBP)
    if (hex.startsWith("52 49 46 46") && hex.includes("57 45 42 50"))
      return "WEBP";

    // BMP: 42 4D
    if (hex.startsWith("42 4D")) return "BMP";

    // AVIF: .... 66 74 79 70 61 76 69 66 (ftypavif)
    if (hex.includes("66 74 79 70 61 76 69 66")) return "AVIF";

    // TIFF: 49 49 2A 00 (Little Endian) or 4D 4D 00 2A (Big Endian)
    if (hex.startsWith("49 49 2A 00") || hex.startsWith("4D 4D 00 2A"))
      return "TIFF";

    // HEIC/HEIF: .... 66 74 79 70 68 65 69 63 (ftypheic) or .... 66 74 79 70 6D 69 66 31 (ftypmif1)
    if (hex.includes("66 74 79 70 68 65 69 63")) return "HEIC";
    if (hex.includes("66 74 79 70 6D 69 66 31")) return "HEIF";

    return "UNKNOWN";
  }
}
