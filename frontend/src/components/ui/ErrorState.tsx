interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Unable to load data",
  message = "The request could not be completed.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="state-panel state-panel--error" role="alert">
      <h3>{title}</h3>
      <p>{message}</p>

      {onRetry && (
        <button type="button" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
