interface EmptyStateProps {
  title?: string;
  message: string;
}

export function EmptyState({ title = "No results", message }: EmptyStateProps) {
  return (
    <div className="state-panel">
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}
