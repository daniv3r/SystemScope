import { test, expect } from "@playwright/test";
test("worker asset failure is explicit and restart computes a real baseline", async ({
  page,
}) => {
  await page.route("**/simulation.worker-*.js", (route) => route.abort());
  await page.goto("./");
  await expect(page.getByRole("alert")).toContainText(
    "Simulation worker stopped",
  );
  await expect(
    page.getByText("Computing a fresh baseline…", { exact: true }),
  ).not.toBeVisible();
  await page.unroute("**/simulation.worker-*.js");
  await page.getByRole("button", { name: "Restart simulation" }).click();
  await expect(page.getByTestId("virtual-time")).toHaveText("60.00 s");
});

test("a running worker fault stops animation/progress and restart discards all late results", async ({
  page,
}) => {
  await page.route("**/simulation.worker-*.js", async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body:
        (await response.text()) +
        `;self.addEventListener('message',e=>{if(e.data.type==='REPLACE'&&e.data.execution==='playback')setTimeout(()=>{throw new Error('Injected worker fault')},0)});`,
    });
  });
  await page.goto("./");
  await expect(page.getByTestId("virtual-time")).toHaveText("60.00 s");
  await page.getByRole("button",{name:"Show charts",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Traffic in, work out"})).toBeVisible();
  await page
    .getByRole("button", { name: "Watch simulation", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "Simulation worker stopped",
  );
  await expect(page.getByTestId("run-status")).toHaveText("failed");
  const time = await page.getByTestId("virtual-time").innerText();
  await page.waitForTimeout(200);
  await expect(page.getByTestId("virtual-time")).toHaveText(time);
  expect(await page.locator(".flow-line").count()).toBe(0);
  await page.unroute("**/simulation.worker-*.js");
  await page.getByRole("button", { name: "Restart simulation" }).click();
  await expect(page.getByTestId("virtual-time")).toHaveText("60.00 s");
  await expect(page.getByTestId("run-status")).toHaveText("finished");
  await expect(page.getByRole("button",{name:"Hide charts",exact:true})).toBeVisible();
  await page.getByText("Read chart values as a table").click();
  await expect(page.getByRole("table").locator("tbody tr")).toHaveCount(50);
});
