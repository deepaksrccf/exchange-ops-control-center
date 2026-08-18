interface MetricCardProps {
  label: string;
  value: string | number;
  detail?: string;
  tone?: "default" | "warning" | "danger" | "success";
}

export function MetricCard({
  label,
  value,
  detail,
  tone = "default",
}: MetricCardProps) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <span className="metric-card__label">{label}</span>
      <strong className="metric-card__value">{value}</strong>
      {detail && <span className="metric-card__detail">{detail}</span>}
    </article>
  );
}
