import React, { useState } from "react";
import { ActionIcon, Box, Tooltip, Transition } from "@mantine/core";
import {
  IconDownload,
  IconX,
  IconCheck,
  IconBan,
  IconEyeOff,
} from "@tabler/icons-react";
import { t } from "../../core/utils/i18n";

// ==============================================
// Types
// ==============================================
interface FloatingButtonProps {
  visible: boolean;
  status?: "idle" | "downloading" | "success" | "error";
  progress?: number;
  onDownload: () => void;
  onClose: () => void;
  onDisable?: () => void;
  onHidePermanent?: () => void;
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
      left: -30px;
      right: -30px;
      bottom: -50px;
      background: transparent;
      pointer-events: none;
      z-index: -2;
    }
    
    .imaget-glass-wrapper:hover::after {
      pointer-events: auto;
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
      height: 100%;
      background: var(--mantine-color-blue-filled);
      opacity: 0.5;
      transform: scaleY(var(--imaget-progress-scale, 0));
      transform-origin: bottom;
      transition: transform 0.15s linear, opacity 0.3s ease;
      z-index: 0;
      pointer-events: none;
      will-change: transform;
    }

    .imaget-glass-button[data-status="success"] {
      background: color-mix(in srgb, var(--mantine-color-green-5), transparent 75%) !important;
      backdrop-filter: blur(20px) !important;
      box-shadow: 0 0 20px color-mix(in srgb, var(--mantine-color-green-5), transparent 60%), inset 0 0 0 1px color-mix(in srgb, var(--mantine-color-green-5), transparent 40%) !important;
    }

    .imaget-glass-button[data-status="success"] .imaget-progress-fill {
      opacity: 0;
      transition: transform 0.3s ease-out, opacity 0.5s ease 0.1s;
    }

    .imaget-glass-button[data-status="downloading"],
    .imaget-glass-button[data-status="error"] {
      background: color-mix(in srgb, var(--mantine-color-dark-7), transparent 20%) !important;
      backdrop-filter: blur(12px) !important;
      -webkit-backdrop-filter: blur(12px) !important;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), inset 0 0 0 1px color-mix(in srgb, var(--mantine-color-white), transparent 90%) !important;
      transform: scale(1.1) translate3d(0, 0, 0) !important;
    }

    .imaget-glass-button[data-status="error"] {
      background: color-mix(in srgb, var(--mantine-color-red-6), transparent 72%) !important;
      box-shadow: 0 0 20px color-mix(in srgb, var(--mantine-color-red-6), transparent 50%), inset 0 0 0 1px color-mix(in srgb, var(--mantine-color-red-4), transparent 40%) !important;
    }

    .imaget-glass-wrapper:hover .imaget-glass-button {
      background: color-mix(in srgb, var(--mantine-color-dark-7), transparent 20%) !important;
      backdrop-filter: blur(12px) !important;
      -webkit-backdrop-filter: blur(12px) !important;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), inset 0 0 0 1px color-mix(in srgb, var(--mantine-color-white), transparent 90%) !important;
      transform: scale(1.1) translate3d(0, 0, 0) !important;
    }

    .imaget-glass-wrapper:hover .imaget-icon-inner {
      animation: imaget-icon-pulse 0.4s ease-out !important;
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

// ==============================================
// Sub-Components
// ==============================================
const MainDownloadAction = ({
  status,
  progress,
  portalNode,
  onClick,
}: {
  status: "idle" | "downloading" | "success" | "error";
  progress: number;
  portalNode: HTMLDivElement | null;
  onClick: () => void;
}) => (
  <Tooltip
    label={
      status === "success"
        ? t("labelFloatingSuccess")
        : status === "error"
          ? t("labelFloatingError")
          : t("labelFloatingDownload")
    }
    position="left"
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
          "--imaget-progress-scale": status === "success" ? 1 : progress / 100,
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
              status === "success" ? "scale(1)" : "scale(0.5) translateY(10px)",
            transition: "all 0.5s ease-out",
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
            transition: "all 0.5s ease-out",
          }}
        />
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
            transition: "all 0.5s ease-out",
          }}
        />
      </Box>
    </ActionIcon>
  </Tooltip>
);

const CloseAction = ({
  visible,
  portalNode,
  onClick,
}: {
  visible: boolean;
  portalNode: HTMLDivElement | null;
  onClick: () => void;
}) => (
  <Transition
    mounted={visible}
    transition={{
      in: { opacity: 1, transform: "translate(26px, 34px) scale(1)" },
      out: { opacity: 0, transform: "translate(0, 0) scale(0.4)" },
      transitionProperty: "transform, opacity",
    }}
    duration={400}
    timingFunction="cubic-bezier(0.34, 1.56, 0.64, 1)"
  >
    {(styles) => (
      <Tooltip
        label={t("labelFloatingClose")}
        position="bottom"
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
            (e.currentTarget.style.transform =
              "translate(26px, 34px) scale(1.2)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.transform = "translate(26px, 34px) scale(1)")
          }
        >
          <IconX size={12} stroke={3} />
        </ActionIcon>
      </Tooltip>
    )}
  </Transition>
);

const DisableAction = ({
  visible,
  portalNode,
  onClick,
}: {
  visible: boolean;
  portalNode: HTMLDivElement | null;
  onClick?: () => void;
}) => {
  if (!onClick) return null;
  return (
    <Transition
      mounted={visible}
      transition={{
        in: {
          opacity: 1,
          transform: "translate(0, 40px) scale(1)",
          transitionDelay: "40ms",
        },
        out: {
          opacity: 0,
          transform: "translate(0, 0) scale(0.4)",
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
          position="bottom"
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
              (e.currentTarget.style.transform =
                "translate(0, 40px) scale(1.2)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = "translate(0, 40px) scale(1)")
            }
          >
            <IconBan size={12} stroke={3} />
          </ActionIcon>
        </Tooltip>
      )}
    </Transition>
  );
};

const HidePermanentAction = ({
  visible,
  portalNode,
  onClick,
}: {
  visible: boolean;
  portalNode: HTMLDivElement | null;
  onClick?: () => void;
}) => {
  if (!onClick) return null;
  return (
    <Transition
      mounted={visible}
      transition={{
        in: {
          opacity: 1,
          transform: "translate(-26px, 34px) scale(1)",
          transitionDelay: "80ms",
        },
        out: {
          opacity: 0,
          transform: "translate(0, 0) scale(0.4)",
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
          position="bottom"
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
              (e.currentTarget.style.transform =
                "translate(-26px, 34px) scale(1.2)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform =
                "translate(-26px, 34px) scale(1)")
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
  onDownload,
  onClose,
  onDisable,
  onHidePermanent,
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
        style={{ pointerEvents: "auto" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <MainDownloadAction
          status={status}
          progress={progress}
          portalNode={portalNode}
          onClick={onDownload}
        />

        <HidePermanentAction
          visible={hovered}
          portalNode={portalNode}
          onClick={onHidePermanent}
        />
        <DisableAction
          visible={hovered}
          portalNode={portalNode}
          onClick={onDisable}
        />
        <CloseAction
          visible={hovered}
          portalNode={portalNode}
          onClick={onClose}
        />
      </div>
    </Box>
  );
};
