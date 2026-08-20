import { expect, test } from "@playwright/test";

test("loads operational pages and real-time status", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Operations Overview" }),
  ).toBeVisible();
  await expect(
    page.getByRole("status").filter({ hasText: "API connected" }),
  ).toBeVisible();
  await expect(
    page.getByRole("status").filter({ hasText: "Live connected" }),
  ).toBeVisible();

  for (const [linkName, heading] of [
    ["Event Monitor", "Event Monitor"],
    ["Alert Queue", "Alert Queue"],
    ["Incidents", "Incident Management"],
    ["Analytics", "Operations Analytics"],
    ["System", "System Status"],
  ]) {
    await page.getByRole("link", { name: linkName }).click();
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
});
