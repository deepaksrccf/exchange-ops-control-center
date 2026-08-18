interface LoadingStateProps {
  message?: string;
}

export function LoadingState({
  message = "Loading data...",
}: LoadingStateProps) {
  return (
    <div className="state-panel" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
