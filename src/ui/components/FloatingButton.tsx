import React, { useState } from "react";
import { ActionIcon, Box, Tooltip, Transition } from "@mantine/core";
import {
  IconDownload,
  IconX,
  IconCheck,
  IconBan,
  IconEyeOff,
  IconArrowDown,
  IconCopy,
} from "@tabler/icons-react";
import { useI18n } from "../hooks/useI18n";

// ==============================================
// Types
// ==============================================
/**
 * 复制图片的反馈状态：
 * - idle: 可点击
 * - busy: 正在取图 / 写入剪贴板
 * - image: 图片已写入剪贴板
 * - link: 图片复制失败，已退化为复制链接
 * - error: 图片与链接都复制失败
 */
export type CopyStatus = "idle" | "busy" | "image" | "link" | "error";

/**
 * 次要动作的展开方向：
 * - rail: 主按钮正下方竖向轨道（默认）
 * - row: 图片太矮或贴近视口底部时，改为向左横向展开
 */
export type FloatingActionLayout = "rail" | "row";

interface FloatingButtonProps {
  visible: boolean;
  status?: "idle" | "downloading" | "success" | "error";
  progress?: number;
  copyStatus?: CopyStatus;
  layout?: FloatingActionLayout;
  onDownload: () => void;
  onCopy?: () => void;
  onClose: () => void;
  onDisable?: () => void;
  onHidePermanent?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

// ==============================================
// Styles & Animations
// ==============================================
const GlobalAnimations = () => (
  <style>{`
    @keyframes imaget-pop-in {
      from { opacity: 0; transform: scale(0.8) translate3d(0, -10px, 0); }
      to { opacity: 1; transform: scale(1) translate3d(0, 0, 0); }
    }
    
    .imaget-pop-in-animated {
      animation: imaget-pop-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
    }

    @keyframes imaget-icon-pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    /* 彗星轨道环：conic 渐变拖尾 + mask 镂空成环，仅 transform 动画 */
    @keyframes imaget-orbit {
      0% { transform: rotate(0deg) scale(1); }
      50% { transform: rotate(200deg) scale(0.9); }
      100% { transform: rotate(360deg) scale(1); }
    }

    /* 箭头落入：上落入位 → 停顿 → 下沉淡出，隐喻下载吸入 */
    @keyframes imaget-drop {
      0% { transform: translateY(-5px) scale(0.9); opacity: 0; }
      35% { transform: translateY(0) scale(1); opacity: 1; }
      65% { transform: translateY(0) scale(1); opacity: 1; }
      100% { transform: translateY(6px) scale(0.85); opacity: 0; }
    }

    @keyframes imaget-loader-in {
      from { opacity: 0; transform: scale(0.6); }
      to { opacity: 1; transform: scale(1); }
    }

    @keyframes imaget-spin {
      to { transform: rotate(360deg); }
    }

    .imaget-copy-spinner {
      position: absolute;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.25);
      border-top-color: rgba(255, 255, 255, 0.95);
      animation: imaget-spin 0.8s linear infinite;
    }

    @media (prefers-reduced-motion: reduce) {
      .imaget-copy-spinner {
        animation-duration: 2s;
      }
    }

    .imaget-loader {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: imaget-loader-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .imaget-loader-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: conic-gradient(
        from 0deg,
        rgba(255, 255, 255, 0) 0deg,
        rgba(255, 255, 255, 0.1) 210deg,
        rgba(255, 255, 255, 0.9) 340deg,
        #fff 360deg
      );
      -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2.5px), #000 calc(100% - 2px));
      mask: radial-gradient(farthest-side, transparent calc(100% - 2.5px), #000 calc(100% - 2px));
      animation: imaget-orbit 1.15s cubic-bezier(0.65, 0.1, 0.35, 0.9) infinite;
      will-change: transform;
    }

    .imaget-loader-arrow {
      color: var(--mantine-color-white);
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));
      animation: imaget-drop 1.4s cubic-bezier(0.45, 0, 0.25, 1) infinite;
      will-change: transform, opacity;
    }

    /* 降级：系统关闭动画（如远程桌面会话）时不做位移运动，仅透明度呼吸保留加载信号 */
    @keyframes imaget-breathe {
      0%, 100% { opacity: 0.35; }
      50% { opacity: 1; }
    }

    @media (prefers-reduced-motion: reduce) {
      .imaget-loader-ring {
        animation: imaget-breathe 1.6s ease-in-out infinite;
      }
      .imaget-loader-arrow {
        animation: none;
      }
    }
    
    .imaget-glass-wrapper {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 40px !important; 
      height: 40px !important;
      pointer-events: auto !important;
      position: relative;
      backface-visibility: hidden;
      -webkit-font-smoothing: antialiased;
      will-change: transform;
      transform: translate3d(0, 0, 0);
    }

    /* 🚀 增加透明桥接层，防止鼠标移动到子按钮过程中因间隙导致闪烁 */
    .imaget-glass-wrapper::after {
      content: "";
      position: absolute;
      top: -5px;
      left: -36px;
      right: -36px;
      bottom: -124px;
      background: transparent;
      pointer-events: none;
      z-index: -2;
    }
    
    .imaget-glass-wrapper:hover::after {
      pointer-events: auto;
    }

    /* 横向布局：桥接层覆盖主按钮左侧的动作带，避免移向动作时丢失 hover */
    .imaget-glass-wrapper[data-layout="row"]::after {
      top: -8px;
      left: -132px;
      right: -12px;
      bottom: -14px;
    }

    .imaget-glass-button {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 40px !important;
      height: 40px !important;
      background: transparent !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      border: none !important;
      box-shadow: none !important;
      transition: background 0.4s ease, backdrop-filter 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease !important;
      backface-visibility: hidden;
      -webkit-font-smoothing: antialiased;
      position: relative;
      overflow: hidden !important;
      will-change: transform;
      transform: translate3d(0, 0, 0);
    }
    
    .imaget-progress-fill {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: var(--imaget-progress, 0%);
      background: linear-gradient(to top, rgba(0, 217, 255, 0.4), rgba(0, 255, 128, 0.5));
      transition: height 0.15s linear, opacity 0.3s ease;
      z-index: 0;
      pointer-events: none;
    }

    .imaget-glass-button[data-status="success"] {
      background: color-mix(in srgb, var(--mantine-color-green-5), transparent 75%) !important;
      backdrop-filter: blur(20px) !important;
      box-shadow: 0 0 20px color-mix(in srgb, var(--mantine-color-green-5), transparent 60%), inset 0 0 0 1px color-mix(in srgb, var(--mantine-color-green-5), transparent 40%) !important;
    }

    .imaget-glass-button[data-status="success"] .imaget-progress-fill {
      opacity: 0;
      transition: height 0.3s ease-out, opacity 0.5s ease 0.1s;
    }

    .imaget-glass-button[data-status="downloading"],
    .imaget-glass-button[data-status="error"] {
      background: color-mix(in srgb, var(--mantine-color-white), transparent 78%) !important;
      backdrop-filter: blur(25px) saturate(160%) contrast(1.1) brightness(1.1) !important;
      -webkit-backdrop-filter: blur(25px) saturate(160%) contrast(1.1) brightness(1.1) !important;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.35), inset 0 0 0 1px color-mix(in srgb, var(--mantine-color-white), transparent 60%), inset 0 1px 1px color-mix(in srgb, var(--mantine-color-white), transparent 50%) !important;
      transform: scale(1.2) translate3d(0, 0, 0) !important;
    }

    .imaget-glass-button[data-status="error"] {
      background: color-mix(in srgb, var(--mantine-color-red-6), transparent 72%) !important;
      box-shadow: 0 0 20px color-mix(in srgb, var(--mantine-color-red-6), transparent 50%), inset 0 0 0 1px color-mix(in srgb, var(--mantine-color-red-4), transparent 40%) !important;
    }

    .imaget-glass-wrapper:hover .imaget-glass-button {
      background: color-mix(in srgb, var(--mantine-color-white), transparent 78%) !important;
      backdrop-filter: blur(25px) saturate(160%) contrast(1.1) brightness(1.1) !important;
      -webkit-backdrop-filter: blur(25px) saturate(160%) contrast(1.1) brightness(1.1) !important;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.35), inset 0 0 0 1px color-mix(in srgb, var(--mantine-color-white), transparent 60%), inset 0 1px 1px color-mix(in srgb, var(--mantine-color-white), transparent 50%) !important;
      transform: scale(1.2) translate3d(0, 0, 0) !important;
    }

    .imaget-glass-wrapper:hover .imaget-icon-inner {
      animation: imaget-icon-pulse 2s infinite ease-in-out !important;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)) !important;
      stroke-width: 2.8px !important;
    }
  `}</style>
);

const getTooltipStyles = (fontSize = "11px", padding = "4px 10px") => ({
  tooltip: {
    backgroundColor:
      "color-mix(in srgb, var(--mantine-color-dark-8), transparent 25%)",
    backdropFilter: "blur(14px) saturate(180%)",
    border:
      "1px solid color-mix(in srgb, var(--mantine-color-white), transparent 88%)",
    boxShadow: `
      0 4px 6px -1px rgba(0, 0, 0, 0.2), 
      0 10px 20px -5px rgba(0, 0, 0, 0.3),
      inset 0 1px 1px color-mix(in srgb, var(--mantine-color-white), transparent 92%)
    `,
    color: "var(--mantine-color-white)",
    fontWeight: 500,
    fontSize,
    padding,
    letterSpacing: "0.02em",
    fontFamily: "var(--mantine-font-family)",
  },
  arrow: {
    border:
      "1px solid color-mix(in srgb, var(--mantine-color-white), transparent 88%)",
    backgroundColor:
      "color-mix(in srgb, var(--mantine-color-dark-8), transparent 25%)",
    backdropFilter: "blur(14px) saturate(180%)",
  },
});

type ActionKey = "copy" | "disable" | "hide" | "close";

/**
 * 每个动作在两种布局下的位移。
 * rail: 主按钮正下方；row: 主按钮左侧、同一水平线。
 */
const ACTION_OFFSETS: Record<
  FloatingActionLayout,
  Record<ActionKey, { x: number; y: number }>
> = {
  rail: {
    copy: { x: 0, y: 40 },
    disable: { x: 0, y: 66 },
    hide: { x: 0, y: 92 },
    close: { x: 0, y: 118 },
  },
  row: {
    copy: { x: -36, y: 0 },
    disable: { x: -62, y: 0 },
    hide: { x: -88, y: 0 },
    close: { x: -114, y: 0 },
  },
};

const getActionTransform = (
  layout: FloatingActionLayout,
  action: ActionKey,
  scale = 1,
) => {
  const { x, y } = ACTION_OFFSETS[layout][action];
  return `translate(${x}px, ${y}px) scale(${scale})`;
};

const getTooltipPosition = (layout: FloatingActionLayout) =>
  layout === "row" ? "bottom" : "left";

// ==============================================
// Sub-Components
// ==============================================
const MainDownloadAction = ({
  status,
  progress,
  portalNode,
  layout,
  onClick,
}: {
  status: "idle" | "downloading" | "success" | "error";
  progress: number;
  portalNode: HTMLDivElement | null;
  layout: FloatingActionLayout;
  onClick: () => void;
}) => {
  const { t } = useI18n();
  return (
    <Tooltip
      label={
        status === "success"
          ? t("labelFloatingSuccess")
          : status === "error"
            ? t("labelFloatingError")
            : t("labelFloatingDownload")
      }
      // 横向布局时动作在按钮左侧，提示必须让位，否则会盖住整排动作
      position={layout === "row" ? "bottom" : "left"}
      withArrow
      transitionProps={{ transition: "fade", duration: 200 }}
      portalProps={{ target: portalNode || undefined }}
      styles={getTooltipStyles()}
    >
      <ActionIcon
        className="imaget-glass-button"
        variant="transparent"
        size={40}
        radius={12}
        data-status={status}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (status === "idle") onClick();
        }}
        style={
          {
            outline: "none",
            color: "var(--mantine-color-white)",
            "--imaget-progress": status === "success" ? "100%" : `${progress}%`,
          } as React.CSSProperties & { [key: string]: string | number }
        }
        aria-label={
          status === "success"
            ? t("labelFloatingSuccess")
            : status === "error"
              ? t("labelFloatingError")
              : t("labelFloatingDownload")
        }
      >
        <div
          className="imaget-progress-fill"
          style={{ opacity: status === "idle" || status === "error" ? 0 : 1 }}
        />

        <Box
          style={{
            zIndex: 1,
            display: "flex",
            position: "relative",
            alignItems: "center",
            justifyContent: "center",
            width: 22,
            height: 22,
          }}
        >
          <IconCheck
            size={22}
            stroke={3.5}
            style={{
              position: "absolute",
              color: "var(--mantine-color-white)",
              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
              opacity: status === "success" ? 1 : 0,
              transform:
                status === "success"
                  ? "scale(1)"
                  : "scale(0.5) translateY(10px)",
              transition: "all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            }}
          />
          <IconX
            size={22}
            stroke={3}
            style={{
              position: "absolute",
              color: "var(--mantine-color-red-3)",
              filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.6))",
              opacity: status === "error" ? 1 : 0,
              transform:
                status === "error" ? "scale(1)" : "scale(0.5) translateY(10px)",
              transition: "all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            }}
          />
          {status === "downloading" ? (
            <div className="imaget-loader" aria-hidden="true">
              <span className="imaget-loader-ring" />
              <IconArrowDown
                className="imaget-loader-arrow"
                size={13}
                stroke={2.75}
              />
            </div>
          ) : (
            <IconDownload
              className="imaget-icon-inner"
              size={22}
              stroke={2.5}
              style={{
                position: "absolute",
                opacity: status === "success" || status === "error" ? 0 : 1,
                transform:
                  status === "success" || status === "error"
                    ? "scale(0.5) translateY(-10px)"
                    : "scale(1) translateY(0)",
                filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))",
                transition: "all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
              }}
            />
          )}
        </Box>
      </ActionIcon>
    </Tooltip>
  );
};

const CloseAction = ({
  visible,
  portalNode,
  layout,
  onClick,
}: {
  visible: boolean;
  portalNode: HTMLDivElement | null;
  layout: FloatingActionLayout;
  onClick: () => void;
}) => {
  const { t } = useI18n();
  const transform = getActionTransform(layout, "close");
  return (
    <Transition
      mounted={visible}
      transition={{
        in: {
          opacity: 1,
          transform,
          transitionDelay: "100ms",
        },
        out: { opacity: 0, transform: getActionTransform(layout, "close", 0.4) },
        transitionProperty: "transform, opacity",
      }}
      duration={400}
      timingFunction="cubic-bezier(0.34, 1.56, 0.64, 1)"
    >
      {(styles) => (
        <Tooltip
          label={t("labelFloatingClose")}
          position={getTooltipPosition(layout)}
          withArrow
          transitionProps={{ transition: "fade", duration: 200 }}
          portalProps={{ target: portalNode || undefined }}
          styles={getTooltipStyles("10px", "3px 8px")}
        >
          <ActionIcon
            variant="subtle"
            color="gray.5"
            size={20}
            radius="xl"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onClick();
            }}
            style={{
              ...styles,
              position: "absolute",
              top: 10,
              left: 10,
              backgroundColor: "rgba(0, 0, 0, 0.45)",
              backdropFilter: "blur(8px)",
              border:
                "1px solid color-mix(in srgb, var(--mantine-color-white), transparent 85%)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              zIndex: -1,
              transition:
                styles.transition +
                ", background-color 0.2s ease, transform 0.2s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = getActionTransform(
                layout,
                "close",
                1.2,
              ))
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = getActionTransform(
                layout,
                "close",
              ))
            }
          >
            <IconX size={12} stroke={3} />
          </ActionIcon>
        </Tooltip>
      )}
    </Transition>
  );
};

const DisableAction = ({
  visible,
  portalNode,
  layout,
  onClick,
}: {
  visible: boolean;
  portalNode: HTMLDivElement | null;
  layout: FloatingActionLayout;
  onClick?: () => void;
}) => {
  const { t } = useI18n();
  if (!onClick) return null;
  const transform = getActionTransform(layout, "disable");
  return (
    <Transition
      mounted={visible}
      transition={{
        in: {
          opacity: 1,
          transform,
          transitionDelay: "60ms",
        },
        out: {
          opacity: 0,
          transform: getActionTransform(layout, "disable", 0.4),
          transitionDelay: "0ms",
        },
        transitionProperty: "transform, opacity",
      }}
      duration={400}
      timingFunction="cubic-bezier(0.34, 1.56, 0.64, 1)"
    >
      {(styles) => (
        <Tooltip
          label={t("labelFloatingDisable")}
          position={getTooltipPosition(layout)}
          withArrow
          transitionProps={{ transition: "fade", duration: 200 }}
          portalProps={{ target: portalNode || undefined }}
          styles={getTooltipStyles("10px", "3px 8px")}
        >
          <ActionIcon
            variant="subtle"
            color="red.4"
            size={20}
            radius="xl"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onClick();
            }}
            style={{
              ...styles,
              position: "absolute",
              top: 10,
              left: 10,
              backgroundColor: "rgba(0, 0, 0, 0.45)",
              backdropFilter: "blur(8px)",
              border:
                "1px solid color-mix(in srgb, var(--mantine-color-white), transparent 85%)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              zIndex: -1,
              transition:
                styles.transition +
                ", background-color 0.2s ease, transform 0.2s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = getActionTransform(
                layout,
                "disable",
                1.2,
              ))
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = getActionTransform(
                layout,
                "disable",
              ))
            }
          >
            <IconBan size={12} stroke={3} />
          </ActionIcon>
        </Tooltip>
      )}
    </Transition>
  );
};

const CopyAction = ({
  visible,
  portalNode,
  layout,
  status,
  onClick,
}: {
  visible: boolean;
  portalNode: HTMLDivElement | null;
  layout: FloatingActionLayout;
  status: CopyStatus;
  onClick?: () => void;
}) => {
  const { t } = useI18n();
  if (!onClick) return null;

  const label =
    status === "image"
      ? t("labelFloatingCopySuccess")
      : status === "link"
        ? t("labelFloatingCopyLinkSuccess")
        : status === "error"
          ? t("labelFloatingCopyError")
          : t("labelFloatingCopy");

  const isBusy = status === "busy";
  const showSuccess = status === "image" || status === "link";
  const showError = status === "error";
  const transform = getActionTransform(layout, "copy");

  return (
    <Transition
      mounted={visible}
      transition={{
        in: {
          opacity: 1,
          transform,
          transitionDelay: "40ms",
        },
        out: {
          opacity: 0,
          transform: getActionTransform(layout, "copy", 0.4),
          transitionDelay: "0ms",
        },
        transitionProperty: "transform, opacity",
      }}
      duration={400}
      timingFunction="cubic-bezier(0.34, 1.56, 0.64, 1)"
    >
      {(styles) => (
        <Tooltip
          label={label}
          position={getTooltipPosition(layout)}
          withArrow
          transitionProps={{ transition: "fade", duration: 200 }}
          portalProps={{ target: portalNode || undefined }}
          styles={getTooltipStyles("10px", "3px 8px")}
        >
          <ActionIcon
            variant="subtle"
            color={showError ? "red.4" : "gray.2"}
            size={20}
            radius="xl"
            aria-label={label}
            aria-busy={isBusy}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (!isBusy) onClick();
            }}
            style={{
              ...styles,
              position: "absolute",
              top: 10,
              left: 10,
              backgroundColor: "rgba(0, 0, 0, 0.45)",
              backdropFilter: "blur(8px)",
              border:
                "1px solid color-mix(in srgb, var(--mantine-color-white), transparent 85%)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              zIndex: -1,
              transition:
                styles.transition +
                ", background-color 0.2s ease, transform 0.2s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = getActionTransform(
                layout,
                "copy",
                1.2,
              ))
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = getActionTransform(
                layout,
                "copy",
              ))
            }
          >
            <Box
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 12,
                height: 12,
                position: "relative",
              }}
            >
              <IconCopy
                size={12}
                stroke={3}
                style={{ opacity: isBusy || showSuccess || showError ? 0 : 1 }}
              />
              {isBusy && <span className="imaget-copy-spinner" />}
              <IconCheck
                size={12}
                stroke={3.5}
                style={{
                  position: "absolute",
                  color: "var(--mantine-color-green-4)",
                  opacity: showSuccess ? 1 : 0,
                }}
              />
              <IconX
                size={12}
                stroke={3}
                style={{
                  position: "absolute",
                  color: "var(--mantine-color-red-4)",
                  opacity: showError ? 1 : 0,
                }}
              />
            </Box>
          </ActionIcon>
        </Tooltip>
      )}
    </Transition>
  );
};

const HidePermanentAction = ({
  visible,
  portalNode,
  layout,
  onClick,
}: {
  visible: boolean;
  portalNode: HTMLDivElement | null;
  layout: FloatingActionLayout;
  onClick?: () => void;
}) => {
  const { t } = useI18n();
  if (!onClick) return null;
  const transform = getActionTransform(layout, "hide");
  return (
    <Transition
      mounted={visible}
      transition={{
        in: {
          opacity: 1,
          transform,
          transitionDelay: "80ms",
        },
        out: {
          opacity: 0,
          transform: getActionTransform(layout, "hide", 0.4),
          transitionDelay: "0ms",
        },
        transitionProperty: "transform, opacity",
      }}
      duration={400}
      timingFunction="cubic-bezier(0.34, 1.56, 0.64, 1)"
    >
      {(styles) => (
        <Tooltip
          label={t("labelFloatingHidePermanent")}
          position={getTooltipPosition(layout)}
          withArrow
          transitionProps={{ transition: "fade", duration: 200 }}
          portalProps={{ target: portalNode || undefined }}
          styles={getTooltipStyles("10px", "3px 8px")}
        >
          <ActionIcon
            variant="subtle"
            color="orange.4"
            size={20}
            radius="xl"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onClick();
            }}
            style={{
              ...styles,
              position: "absolute",
              top: 10,
              left: 10,
              backgroundColor: "rgba(0, 0, 0, 0.45)",
              backdropFilter: "blur(8px)",
              border:
                "1px solid color-mix(in srgb, var(--mantine-color-white), transparent 85%)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
              zIndex: -1,
              transition:
                styles.transition +
                ", background-color 0.2s ease, transform 0.2s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = getActionTransform(
                layout,
                "hide",
                1.2,
              ))
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = getActionTransform(
                layout,
                "hide",
              ))
            }
          >
            <IconEyeOff size={12} stroke={3} />
          </ActionIcon>
        </Tooltip>
      )}
    </Transition>
  );
};

// ==============================================
// Main Component
// ==============================================
export const FloatingButton: React.FC<FloatingButtonProps> = ({
  visible,
  status = "idle",
  progress = 0,
  copyStatus = "idle",
  layout = "rail",
  onDownload,
  onCopy,
  onClose,
  onDisable,
  onHidePermanent,
  onMouseEnter,
  onMouseLeave,
}) => {
  const [portalNode, setPortalNode] = useState<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState(false);

  return (
    <Box
      style={
        {
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 999999,
          pointerEvents: "none",
          animation: visible
            ? "imaget-pop-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards"
            : "none",
          backfaceVisibility: "hidden",
          WebkitFontSmoothing: "antialiased",
          transform: "translate3d(0, 0, 0)",
        } as React.CSSProperties
      }
    >
      <GlobalAnimations />

      <div
        ref={setPortalNode}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 99999,
          pointerEvents: "none",
        }}
      />

      <div
        className="imaget-glass-wrapper"
        data-layout={layout}
        style={{ pointerEvents: "auto" }}
        onMouseEnter={() => {
          setHovered(true);
          onMouseEnter?.();
        }}
        onMouseLeave={() => {
          setHovered(false);
          onMouseLeave?.();
        }}
      >
        <MainDownloadAction
          status={status}
          progress={progress}
          portalNode={portalNode}
          layout={layout}
          onClick={onDownload}
        />

        <HidePermanentAction
          visible={hovered}
          portalNode={portalNode}
          layout={layout}
          onClick={onHidePermanent}
        />
        <CopyAction
          visible={hovered || copyStatus !== "idle"}
          portalNode={portalNode}
          layout={layout}
          status={copyStatus}
          onClick={onCopy}
        />
        <DisableAction
          visible={hovered}
          portalNode={portalNode}
          layout={layout}
          onClick={onDisable}
        />
        <CloseAction
          visible={hovered}
          portalNode={portalNode}
          layout={layout}
          onClick={onClose}
        />
      </div>
    </Box>
  );
};
