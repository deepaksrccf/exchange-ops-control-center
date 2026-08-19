import { createBrowserRouter } from "react-router-dom";

import { AppShell } from "../components/layout/AppShell";
import { OperationsOverviewPage } from "../pages/OperationsOverviewPage";
import { PlaceholderPage } from "../pages/PlaceholderPage";
import { SystemPage } from "../pages/SystemPage";
import { EventMonitorPage } from "../pages/EventMonitorPage";
import { AlertQueuePage } from "../pages/AlertQueuePage";
import { AlertDetailPage } from "../pages/AlertDetailPage";
import { IncidentManagementPage } from "../pages/IncidentManagementPage";
import { IncidentDetailPage } from "../pages/IncidentDetailPage";
import { OperationsAnalyticsPage } from "../pages/OperationsAnalyticsPage";

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
        element: <IncidentManagementPage />,
      },
      {
        path: "/incidents/:id",
        element: <IncidentDetailPage />,
      },
      {
        path: "/analytics",
        element: <OperationsAnalyticsPage />,
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
