import { expect, test } from "@playwright/test";

async function stopGenerator(page: import("@playwright/test").Page) {
  await page.request.post("/api/v1/generator/stop");
}

test.describe.configure({ mode: "serial" });

test.afterEach(async ({ page }) => {
  await stopGenerator(page);
});

test("controls the synthetic generator lifecycle", async ({ page }) => {
  await page.goto("/system");
  await page.getByRole("tab", { name: "Simulation" }).click();
  await expect(
    page.getByRole("heading", { name: "Generator Status" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Start" }).click();
  await expect(page.getByText("RUNNING", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByText("PAUSED", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Resume" }).click();
  await expect(page.getByText("RUNNING", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Stop" }).click();
  await expect(page.getByText("STOPPED", { exact: true })).toBeVisible();
});

test("shows persisted live events and event details", async ({ page }) => {
  await page.request.post("/api/v1/generator/start");
  await page.goto("/events");

  await expect(
    page.getByRole("status").filter({ hasText: "All systems normal" }),
  ).toBeVisible();

  await page
    .getByRole("status")
    .filter({ hasText: "All systems normal" })
    .click();
  const eventsReceived = page
    .getByText("Events received", { exact: true })
    .locator("xpath=following-sibling::dd[1]");
  await expect(eventsReceived).not.toHaveText("0", { timeout: 15_000 });
  await page.getByRole("heading", { name: "Event Monitor" }).click();
  await expect(
    page.getByRole("dialog", { name: "System health details" }),
  ).toBeHidden();

  await expect(
    page.getByRole("status").filter({ hasText: /rows loaded/ }),
  ).toBeVisible();

  // Pause Display freezes the grid so live updates cannot move the row
  // being interacted with.
  await page.getByRole("button", { name: "Pause Display" }).click();

  const detailsButton = page
    .getByRole("button", { name: /^View event / })
    .first();
  await expect(detailsButton).toBeVisible();
  await detailsButton.click();
  const eventDetails = page.getByRole("dialog", { name: /Sequence/ });
  await expect(eventDetails).toBeVisible();
  await eventDetails.getByLabel("Close event details").click();
  await expect(eventDetails).toBeHidden();
});

test("opens an alert and acknowledges only an open alert", async ({ page }) => {
  await page.request.post("/api/v1/generator/start");
  await page.goto("/alerts");

  await page.getByRole("combobox", { name: "Status" }).selectOption("OPEN");
  const alertTable = page.getByRole("table", {
    name: "Paginated synthetic operational alerts",
  });
  const viewAlert = alertTable
    .getByRole("button", { name: "View", exact: true })
    .first();
  await expect(viewAlert).toBeVisible({ timeout: 15_000 });
  await viewAlert.click();
  await expect(
    page.getByRole("heading", { name: "Triage Actions" }),
  ).toBeVisible();

  const acknowledge = page.getByRole("button", { name: "Acknowledge" });
  await expect(acknowledge).toBeVisible();
  await acknowledge.click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Alert acknowledged successfully." }),
  ).toBeVisible();
});
