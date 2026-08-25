import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { IncidentLifecycle } from "./IncidentLifecycle";

describe("IncidentLifecycle", () => {
  it("marks earlier stages complete and the current stage as current", () => {
    render(<IncidentLifecycle status="MITIGATED" />);

    const current = screen.getByText("MITIGATED").closest("li");
    expect(current).toHaveAttribute("aria-current", "step");

    const open = screen.getByText("OPEN").closest("li");
    expect(open).not.toHaveAttribute("aria-current");

    const closed = screen.getByText("CLOSED").closest("li");
    expect(closed).not.toHaveAttribute("aria-current");
  });

  it("renders all five lifecycle stages in order", () => {
    render(<IncidentLifecycle status="OPEN" />);

    const stages = screen
      .getAllByRole("listitem")
      .map((item) => item.textContent);

    expect(stages).toEqual([
      "1OPEN",
      "2INVESTIGATING",
      "3MITIGATED",
      "4RESOLVED",
      "5CLOSED",
    ]);
  });
});
