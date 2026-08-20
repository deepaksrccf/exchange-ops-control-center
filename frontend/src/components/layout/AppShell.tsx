import { useEffect } from "react";
import { Outlet } from "react-router-dom";

import { useThemeStore } from "../../store/themeStore";
import { useRealtimeEvents } from "../../hooks/useRealtimeEvents";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { LiveAlertNotifications } from "../realtime/LiveAlertNotifications";

export function AppShell() {
  useRealtimeEvents();

  const collapsed = useThemeStore((state) => state.sidebarCollapsed);
  const mobileOpen = useThemeStore((state) => state.mobileNavigationOpen);
  const closeMobileNavigation = useThemeStore(
    (state) => state.closeMobileNavigation,
  );

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
      <Sidebar />

      <div className="app-shell__content">
        <TopBar />

        <main className="main-content" id="main-content">
          <Outlet />
        </main>
      </div>
      <LiveAlertNotifications />
    </div>
  );
}
