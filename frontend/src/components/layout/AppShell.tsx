import { useEffect } from "react";
import { Outlet } from "react-router-dom";

import { useThemeStore } from "../../store/themeStore";
import { useRealtimeEvents } from "../../hooks/useRealtimeEvents";
import { useRealtimeStore } from "../../store/realtimeStore";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { CommandPalette } from "../shell/CommandPalette";

export function AppShell() {
  useRealtimeEvents();

  const collapsed = useThemeStore((state) => state.sidebarCollapsed);
  const mobileOpen = useThemeStore((state) => state.mobileNavigationOpen);
  const closeMobileNavigation = useThemeStore(
    (state) => state.closeMobileNavigation,
  );
  const realtimeState = useRealtimeStore((state) => state.state);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && mobileOpen) {
        closeMobileNavigation();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen, closeMobileNavigation]);

  return (
    <div
      className={["app-shell", collapsed ? "app-shell--sidebar-collapsed" : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <Sidebar />

      <div className="app-shell__content">
        <TopBar />

        {realtimeState === "RECONNECTING" && (
          <div
            className="connection-banner connection-banner--warning"
            role="status"
          >
            Live updates are reconnecting. Data on screen may be out of date.
          </div>
        )}

        {realtimeState === "ERROR" && (
          <div
            className="connection-banner connection-banner--danger"
            role="alert"
          >
            Live updates are unavailable. Refresh manually or wait for
            reconnection.
          </div>
        )}

        <main className="main-content" id="main-content">
          <Outlet />
        </main>
      </div>

      <CommandPalette />
    </div>
  );
}
