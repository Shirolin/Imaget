import type { Settings } from "../../types";

/**
 * 平台适配器接口
 * 对齐旧项目架构，确保跨环境下载稳定性
 */
export interface IPlatformAdapter {
  env: "extension" | "web";

  /**
   * 跨域获取图片数据
   */
  fetchBlob(url: string, referer?: string): Promise<Blob>;

  /**
   * 本地存储封装
   */
  storage: {
    get<T>(key: string, defaultVal?: T): Promise<T>;
    set(key: string, value: unknown): Promise<void>;
  };

  /**
   * 触发文件下载
   * @param blob 文件数据
   * @param filename 完整路径文件名
   * @param conflictAction 冲突处理 (uniquify, overwrite)
   */
  download(
    blob: Blob,
    filename: string,
    conflictAction?: "uniquify" | "overwrite" | "prompt",
  ): Promise<void>;

  downloadUrl?(
    url: string,
    filename: string,
    conflictAction?: "uniquify" | "overwrite" | "prompt",
    referer?: string,
  ): Promise<void>;

  /**
   * 打开选项/设置页
   */
  openOptionsPage(): void;

  /**
   * 获取当前配置
   */
  getSettings(): Promise<Settings>;
}
