import { expect, test } from "@playwright/test";
async function predict(page: import("@playwright/test").Page) {
  for (const key of ["throughput", "latency", "queue"])
    await page.getByTestId(`prediction-${key}-increase`).check();
}
async function run(page: import("@playwright/test").Page) {
  await page
    .getByRole("button", { name: "Run experiment", exact: true })
    .click();
  await expect(page.getByTestId("run-status")).toHaveText("finished", {
    timeout: 30000,
  });
}
test("five stages and both remedies retain the same DB-limited reference", async ({
  page,
}) => {
  if (process.env.LESSON_SPEED === "1") test.setTimeout(240000);
  await page.goto("./");
  await page.getByRole("button", {name:"Start guided lesson",exact:true}).click();
  await expect(page.getByTestId("virtual-time")).toHaveText("5.00 s");
  await page
    .getByLabel("Playback speed")
    .selectOption(process.env.LESSON_SPEED || "4");
  const started = Date.now();
  await run(page);
  const results: number[] = [];
  for (let stage = 2; stage <= 5; stage++) {
    await page.getByRole("button", { name: "Next stage", exact: true }).click();
    await predict(page);
    await run(page);
    results.push(
      Number(
        await page.getByTestId("completed-value").getAttribute("data-value"),
      ),
    );
  }
  console.log(
    "Five-stage walkthrough elapsed seconds:",
    (Date.now() - started) / 1000,
  );
  expect((Date.now() - started) / 1000).toBeLessThan(300);
  expect(results[1]).toBeGreaterThan(results[0] * 1.1);
  expect(Math.abs(results[2] - results[1])).toBeLessThanOrEqual(
    results[1] * 0.05,
  );
  expect(results[3]).toBeGreaterThanOrEqual(850);
  await page.getByRole("button", { name: "Try the other remedy" }).click();
  await predict(page);
  await run(page);
  expect(
    Number(
      await page.getByTestId("completed-value").getAttribute("data-value"),
    ),
  ).toBeGreaterThanOrEqual(850);
  await expect(page.getByTestId("reference-config")).toContainText(
    "8 API · normal DB · cache off",
  );
});

test("Explore directly compares API scale, DB plateau, and each remedy without the lesson", async ({page}) => {
  await page.goto("./");
  await page.getByLabel("Offered traffic, requests per second").selectOption("1000");
  const rates: number[] = [];
  for (const n of [1,4,8]) {
    await page.getByLabel("API replicas",{exact:true}).selectOption(String(n));
    await run(page);
    rates.push(Number(await page.getByTestId("completed-value").getAttribute("data-value")));
  }
  expect(rates[1]).toBeGreaterThan(rates[0]*1.1);
  expect(Math.abs(rates[2]-rates[1])).toBeLessThanOrEqual(rates[1]*0.05);
  await expect(page.locator(".insight")).toContainText("Database");
  await expect(page.getByTestId("reference-config")).toContainText("4 API");
  await page.getByLabel("Enable cache").check();
  await run(page);
  expect(Number(await page.getByTestId("completed-value").getAttribute("data-value"))).toBeGreaterThanOrEqual(850);
  await expect(page.locator(".insight")).toContainText("lookup CPU work remain");
  await page.getByLabel("Enable cache").uncheck();
  await page.getByLabel("Database service",{exact:true}).selectOption("fast");
  await run(page);
  expect(Number(await page.getByTestId("completed-value").getAttribute("data-value"))).toBeGreaterThanOrEqual(850);
  await expect(page.getByLabel("Guided lesson progress")).toHaveCount(0);
});
