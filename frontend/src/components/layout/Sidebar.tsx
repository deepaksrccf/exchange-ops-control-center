import { NavLink } from "react-router-dom";

const navigation = [
  { to: "/", label: "Operations Overview", end: true },
  { to: "/events", label: "Event Monitor" },
  { to: "/alerts", label: "Alert Queue" },
  { to: "/incidents", label: "Incidents" },
  { to: "/analytics", label: "Analytics" },
  { to: "/system", label: "System" },
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__brand-mark">EO</span>
        <div>
          <strong>Exchange Ops</strong>
          <small>Control Center</small>
        </div>
      </div>

      <nav className="sidebar__nav" aria-label="Primary navigation">
        {navigation.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              isActive ? "sidebar__link sidebar__link--active" : "sidebar__link"
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <span className="status-dot status-dot--healthy" />
        Synthetic environment
      </div>
    </aside>
  );
}
