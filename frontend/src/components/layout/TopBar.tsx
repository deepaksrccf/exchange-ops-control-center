import { Command, Menu, Moon, RefreshCw, Search, Sun } from "lucide-react";
import { useLocation } from "react-router-dom";

import { useApiHealth } from "../../hooks/useOperationsQueries";
import { queryClient } from "../../api/queryClient";
import { useThemeStore } from "../../store/themeStore";

const routeLabels: Record<string, string> = {
  "/": "Operations Overview",
  "/events": "Event Monitor",
  "/alerts": "Alert Queue",
  "/incidents": "Incident Management",
  "/analytics": "Operations Analytics",
  "/system": "System Status",
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

export function TopBar() {
  const location = useLocation();
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const toggleMobileNavigation = useThemeStore(
    (state) => state.toggleMobileNavigation,
  );

  const healthQuery = useApiHealth();
  const apiHealthy = healthQuery.data === true;

  let healthLabel = "API unavailable";

  if (healthQuery.isPending) {
    healthLabel = "Checking API";
  } else if (apiHealthy) {
    healthLabel = "API connected";
  }

  const refreshApplication = async () => {
    await queryClient.invalidateQueries();
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
          <span>Operations</span>
          <strong>{getPageLabel(location.pathname)}</strong>
        </div>
      </div>

      <div className="topbar__search">
        <Search size={17} aria-hidden="true" />
        <input
          type="search"
          aria-label="Search operations console"
          placeholder="Search coming in Phase 2"
          disabled
        />
        <kbd>
          <Command size={13} aria-hidden="true" /> K
        </kbd>
      </div>

      <div className="topbar__actions">
        <span className="environment-badge">Synthetic Data</span>

        <div className="api-indicator" role="status" aria-live="polite">
          <span
            className={
              apiHealthy
                ? "status-dot status-dot--healthy"
                : "status-dot status-dot--unhealthy"
            }
            aria-hidden="true"
          />
          <span>{healthLabel}</span>
        </div>

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
