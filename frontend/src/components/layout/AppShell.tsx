import { useEffect } from "react";
import { Outlet } from "react-router-dom";

import { useThemeStore } from "../../store/themeStore";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppShell() {
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
    </div>
  );
}
