import React, { useState } from "react";
import { ActionIcon, Box, Tooltip, Transition } from "@mantine/core";
import { IconDownload, IconX, IconCheck } from "@tabler/icons-react";
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
          "--imaget-progress": status === "success" ? "100%" : `${progress}%`,
        } as React.CSSProperties & { [key: string]: string | number }
      }
      aria-label={
        status === "success"
          ? t("labelFloatingSuccess")
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
            transition: "all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          }}
        />
        <IconDownload
          className="imaget-icon-inner"
          size={22}
          stroke={2.5}
          style={{
            position: "absolute",
            opacity: status === "success" ? 0 : 1,
            transform:
              status === "success"
                ? "scale(0.5) translateY(-10px)"
                : "scale(1) translateY(0)",
            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))",
            transition: "all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
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
      in: { opacity: 1, transform: "translateY(0)" },
      out: { opacity: 0, transform: "translateY(-8px)" },
      transitionProperty: "transform, opacity",
    }}
    duration={300}
    timingFunction="cubic-bezier(0.16, 1, 0.3, 1)"
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
          size={18}
          radius="xl"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onClick();
          }}
          style={{
            ...styles,
            position: "absolute",
            bottom: -24,
            right: 11,
            backgroundColor: "rgba(0, 0, 0, 0.35)",
            backdropFilter: "blur(8px)",
            border:
              "1px solid color-mix(in srgb, var(--mantine-color-white), transparent 85%)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",

            transition:
              styles.transition +
              ", background-color 0.2s ease, transform 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <IconX size={10} stroke={3} />
        </ActionIcon>
      </Tooltip>
    )}
  </Transition>
);

// ==============================================
// Main Component
// ==============================================
export const FloatingButton: React.FC<FloatingButtonProps> = ({
  visible,
  status = "idle",
  progress = 0,
  onDownload,
  onClose,
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

        <CloseAction
          visible={hovered}
          portalNode={portalNode}
          onClick={onClose}
        />
      </div>
    </Box>
  );
};
