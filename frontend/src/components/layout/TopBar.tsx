import { Command, Menu, Moon, RefreshCw, Sun } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { queryClient } from "../../api/queryClient";
import { useThemeStore } from "../../store/themeStore";
import { NotificationCenter } from "../shell/NotificationCenter";
import { SystemHealthControl } from "../shell/SystemHealthControl";

const routeLabels: Record<string, string> = {
  "/": "Operations Overview",
  "/events": "Event Monitor",
  "/alerts": "Alert Queue",
  "/incidents": "Incident Management",
  "/analytics": "Operations Analytics",
  "/system": "System Status",
};

const breadcrumbSegments: Record<string, string> = {
  events: "Event Monitor",
  alerts: "Alert Queue",
  incidents: "Incident Management",
  analytics: "Operations Analytics",
  system: "System Status",
};

function getPageLabel(pathname: string): string {
  if (routeLabels[pathname]) {
    return routeLabels[pathname];
  }

  if (pathname.startsWith("/alerts/")) {
    return "Alert Investigation";
  }

  if (pathname.startsWith("/incidents/")) {
    return "Incident Details";
  }

  return "Exchange Operations";
}

function getBreadcrumbs(
  pathname: string,
): Array<{ label: string; to: string }> {
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = [{ label: "Overview", to: "/" }];

  let path = "";

  for (const segment of segments) {
    path += `/${segment}`;
    const label = breadcrumbSegments[segment] ?? "Details";
    crumbs.push({ label, to: path });
  }

  return crumbs;
}

export function TopBar() {
  const location = useLocation();
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const toggleMobileNavigation = useThemeStore(
    (state) => state.toggleMobileNavigation,
  );

  const breadcrumbs = getBreadcrumbs(location.pathname);

  const refreshApplication = async () => {
    await queryClient.invalidateQueries();
  };

  const openCommandPalette = () => {
    const event = new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);
  };

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button
          type="button"
          className="icon-button topbar__menu-button"
          aria-label="Open navigation"
          onClick={toggleMobileNavigation}
        >
          <Menu size={20} aria-hidden="true" />
        </button>

        <div className="topbar__page-context">
          <nav aria-label="Breadcrumb" className="topbar__breadcrumbs">
            <ol>
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.to}>
                  {index === breadcrumbs.length - 1 ? (
                    <span aria-current="page">{crumb.label}</span>
                  ) : (
                    <Link to={crumb.to}>{crumb.label}</Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          <strong>{getPageLabel(location.pathname)}</strong>
        </div>
      </div>

      <button
        type="button"
        className="topbar__search"
        onClick={openCommandPalette}
        aria-label="Open command palette"
      >
        <Command size={15} aria-hidden="true" />
        <span>Command palette</span>
        <kbd>Ctrl K</kbd>
      </button>

      <div className="topbar__actions">
        <span className="environment-badge">Synthetic Data</span>

        <SystemHealthControl />

        <NotificationCenter />

        <button
          type="button"
          className="icon-button"
          aria-label="Refresh application data"
          title="Refresh application data"
          onClick={() => void refreshApplication()}
        >
          <RefreshCw size={18} aria-hidden="true" />
        </button>

        <button
          type="button"
          className="icon-button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        >
          {theme === "dark" ? (
            <Sun size={18} aria-hidden="true" />
          ) : (
            <Moon size={18} aria-hidden="true" />
          )}
        </button>
      </div>
    </header>
  );
}
