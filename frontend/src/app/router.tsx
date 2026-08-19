import { createBrowserRouter } from "react-router-dom";

import { AppShell } from "../components/layout/AppShell";
import { OperationsOverviewPage } from "../pages/OperationsOverviewPage";
import { PlaceholderPage } from "../pages/PlaceholderPage";
import { SystemPage } from "../pages/SystemPage";
import { EventMonitorPage } from "../pages/EventMonitorPage";
import { AlertQueuePage } from "../pages/AlertQueuePage";
import { AlertDetailPage } from "../pages/AlertDetailPage";

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      {
        path: "/",
        element: <OperationsOverviewPage />,
      },
      {
        path: "/events",
        element: <EventMonitorPage />,
      },
      {
        path: "/alerts",
        element: <AlertQueuePage />,
      },
      {
        path: "/alerts/:id",
        element: <AlertDetailPage />,
      },
      {
        path: "/incidents",
        element: (
          <PlaceholderPage
            title="Incident Management"
            description="Assign and resolve operational incidents."
          />
        ),
      },
      {
        path: "/incidents/:id",
        element: (
          <PlaceholderPage
            title="Incident Details"
            description="Review notes and incident timeline events."
          />
        ),
      },
      {
        path: "/analytics",
        element: (
          <PlaceholderPage
            title="Operations Analytics"
            description="Analyze event, alert, latency, and incident trends."
          />
        ),
      },
      {
        path: "/system",
        element: <SystemPage />,
      },
      {
        path: "*",
        element: (
          <PlaceholderPage
            title="Page not found"
            description="The requested operations page does not exist."
          />
        ),
      },
    ],
  },
]);
