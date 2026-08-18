import {
  Activity,
  AlertTriangle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Radio,
  ServerCog,
  Siren,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import { useThemeStore } from "../../store/themeStore";

const navigationGroups = [
  {
    label: "Operations",
    items: [
      {
        to: "/",
        label: "Overview",
        icon: Gauge,
        end: true,
      },
      {
        to: "/events",
        label: "Event Monitor",
        icon: Radio,
      },
      {
        to: "/alerts",
        label: "Alert Queue",
        icon: AlertTriangle,
      },
      {
        to: "/incidents",
        label: "Incidents",
        icon: Siren,
      },
    ],
  },
  {
    label: "Insights",
    items: [
      {
        to: "/analytics",
        label: "Analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    label: "Platform",
    items: [
      {
        to: "/system",
        label: "System",
        icon: ServerCog,
      },
    ],
  },
];

export function Sidebar() {
  const collapsed = useThemeStore((state) => state.sidebarCollapsed);
  const mobileOpen = useThemeStore((state) => state.mobileNavigationOpen);
  const toggleSidebar = useThemeStore((state) => state.toggleSidebar);
  const closeMobileNavigation = useThemeStore(
    (state) => state.closeMobileNavigation,
  );

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="navigation-backdrop"
          aria-label="Close navigation"
          onClick={closeMobileNavigation}
        />
      )}

      <aside
        className={[
          "sidebar",
          collapsed ? "sidebar--collapsed" : "",
          mobileOpen ? "sidebar--mobile-open" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="sidebar__brand">
          <div className="sidebar__brand-mark" aria-hidden="true">
            <Activity size={23} strokeWidth={2.2} />
          </div>

          {!collapsed && (
            <div className="sidebar__brand-copy">
              <strong>Exchange Ops</strong>
              <small>Control Center</small>
            </div>
          )}

          <button
            type="button"
            className="sidebar__mobile-close"
            aria-label="Close navigation"
            onClick={closeMobileNavigation}
          >
            <X size={19} aria-hidden="true" />
          </button>
        </div>

        <nav className="sidebar__nav" aria-label="Primary navigation">
          {navigationGroups.map((group) => (
            <section key={group.label} className="sidebar__navigation-group">
              {!collapsed && (
                <h2 className="sidebar__group-label">{group.label}</h2>
              )}

              <div className="sidebar__group-links">
                {group.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      title={collapsed ? item.label : undefined}
                      aria-label={collapsed ? item.label : undefined}
                      onClick={closeMobileNavigation}
                      className={({ isActive }) =>
                        [
                          "sidebar__link",
                          isActive ? "sidebar__link--active" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")
                      }
                    >
                      <Icon
                        className="sidebar__link-icon"
                        size={18}
                        aria-hidden="true"
                      />

                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="environment-status">
            <span
              className="status-dot status-dot--healthy"
              aria-hidden="true"
            />

            {!collapsed && (
              <div>
                <strong>Synthetic Environment</strong>
                <small>MVP 0.1</small>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          className="sidebar__collapse-button"
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          title={collapsed ? "Expand navigation" : "Collapse navigation"}
        >
          {collapsed ? (
            <ChevronRight size={17} aria-hidden="true" />
          ) : (
            <>
              <ChevronLeft size={17} aria-hidden="true" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </aside>
    </>
  );
}
