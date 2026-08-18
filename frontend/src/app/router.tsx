import { createBrowserRouter } from "react-router-dom";

import { AppShell } from "../components/layout/AppShell";
import { PlaceholderPage } from "../pages/PlaceholderPage";

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      {
        path: "/",
        element: (
          <PlaceholderPage
            title="Operations Overview"
            description="Monitor alerts, incidents, event volume, latency, and venue health."
          />
        ),
      },
      {
        path: "/events",
        element: (
          <PlaceholderPage
            title="Event Monitor"
            description="Inspect synthetic exchange events using searchable and filterable data."
          />
        ),
      },
      {
        path: "/alerts",
        element: (
          <PlaceholderPage
            title="Alert Queue"
            description="Review operational alerts and begin investigations."
          />
        ),
      },
      {
        path: "/alerts/:id",
        element: (
          <PlaceholderPage
            title="Alert Investigation"
            description="Review a triggering event, alert explanation, and related activity."
          />
        ),
      },
      {
        path: "/incidents",
        element: (
          <PlaceholderPage
            title="Incident Management"
            description="Assign, investigate, track, and resolve operational incidents."
          />
        ),
      },
      {
        path: "/incidents/:id",
        element: (
          <PlaceholderPage
            title="Incident Details"
            description="Review notes, status changes, resolution details, and timeline events."
          />
        ),
      },
      {
        path: "/analytics",
        element: (
          <PlaceholderPage
            title="Operations Analytics"
            description="Analyze event volume, alerts, processing latency, and incident trends."
          />
        ),
      },
      {
        path: "/system",
        element: (
          <PlaceholderPage
            title="System Administration"
            description="Review venue status, API health, and alert-rule configuration."
          />
        ),
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
