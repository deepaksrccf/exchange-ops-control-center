import { Outlet } from "react-router-dom";

import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppShell() {
  return (
    <div className="app-shell">
      <Sidebar />

      <div className="app-shell__content">
        <TopBar />

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
