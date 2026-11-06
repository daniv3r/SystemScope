import { expect, test } from "@playwright/test";
test("baseline → predict → run spike → evidence", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", {name:"Start guided lesson",exact:true}).click();
  await expect(page.getByTestId("virtual-time")).toHaveText("5.00 s");
  await page.getByLabel("Playback speed").selectOption("4");
  await page
    .getByRole("button", { name: "Run experiment", exact: true })
    .click();
  await expect(page.getByTestId("run-status")).toHaveText("finished", {
    timeout: 30000,
  });
  await page.getByRole("button", { name: "Next stage", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Run experiment", exact: true }),
  ).toBeDisabled();
  for (const key of ["throughput", "latency", "queue"])
    await page.getByTestId(`prediction-${key}-increase`).check();
  await page
    .getByRole("button", { name: "Run experiment", exact: true })
    .click();
  await expect(page.getByTestId("run-status")).toHaveText("finished", {
    timeout: 30000,
  });
  await expect(page.getByTestId("comparison")).toContainText("Your prediction");
  expect(
    Number(
      await page.getByTestId("completed-value").getAttribute("data-value"),
    ),
  ).toBeLessThan(400);
  await expect(
    page.getByText("Educational simulation, not a benchmark", { exact: true }),
  ).toBeVisible();
});
