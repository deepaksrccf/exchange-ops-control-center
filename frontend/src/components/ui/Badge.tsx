import type { PropsWithChildren } from "react";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

interface BadgeProps extends PropsWithChildren {
  tone?: BadgeTone;
}

export function Badge({ tone = "neutral", children }: BadgeProps) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}
