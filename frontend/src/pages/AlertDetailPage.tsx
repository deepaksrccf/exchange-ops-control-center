import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { AlertDetailContent } from "../components/alerts/AlertDetailContent";
import { ErrorState } from "../components/ui/ErrorState";

export function AlertDetailPage() {
  const { id } = useParams();

  if (!id) {
    return <ErrorState message="No alert was specified." />;
  }

  return (
    <div className="page">
      <Link className="back-link" to="/alerts">
        <ArrowLeft size={16} aria-hidden="true" />
        Alert Queue
      </Link>

      <AlertDetailContent alertId={id} />
    </div>
  );
}
