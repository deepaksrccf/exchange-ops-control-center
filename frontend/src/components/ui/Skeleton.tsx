interface SkeletonProps {
  className?: string;
}

export function SkeletonLine({ className = "" }: SkeletonProps) {
  return <span className={`skeleton skeleton--line ${className}`.trim()} />;
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <span className="skeleton skeleton--line skeleton--title" />
      <span className="skeleton skeleton--line" />
      <span className="skeleton skeleton--line skeleton--short" />
    </div>
  );
}

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export function SkeletonTable({ rows = 5, columns = 4 }: SkeletonTableProps) {
  return (
    <div className="skeleton-table" aria-hidden="true">
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="skeleton-table__row">
          {Array.from({ length: columns }, (_, columnIndex) => (
            <span key={columnIndex} className="skeleton skeleton--line" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Full-page skeleton for initial page loads, paired with a screen-reader status. */
export function PageSkeleton({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="page">
      <span className="sr-only" role="status">
        {message}
      </span>

      <div
        className="skeleton skeleton--line skeleton--title"
        style={{ maxWidth: 320 }}
      />
      <div className="skeleton skeleton--line" style={{ maxWidth: 480 }} />

      <div className="dashboard-grid" aria-hidden="true">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
