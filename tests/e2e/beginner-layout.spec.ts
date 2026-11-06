import { expect, test } from "@playwright/test";

for (const width of [360, 768, 1280]) {
  test(`beginner journey, focus, and applied settings at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("./");
    await expect(page.getByTestId("run-status")).toHaveText("finished");
    await expect(page.getByLabel("Request journey")).toBeVisible();
    const cache = page.locator("#topology-cache");
    await expect(cache).toContainText("Off");
    await expect(page.getByRole("figure", {name: "Request and response paths"})).toContainText("CACHE HIT · OFF");
    await expect(page.getByRole("meter")).toHaveCount(3);
    await cache.focus();
    await page.keyboard.press("Enter");
    const inspector = page.getByTestId("inspector");
    await expect(inspector).toBeFocused();
    await expect(cache).toHaveAttribute("aria-expanded", "true");
    for (const title of ["What it does", "What you can change", "How that can affect results"])
      await expect(inspector.getByRole("heading", { name: title, exact: true })).toBeVisible();
    await expect(inspector).toContainText("A hit means the answer is saved");
    const explanationPosition = await inspector.boundingBox();
    const diagramPosition = await page.getByRole("region", { name: "01 Understand the system" }).boundingBox();
    expect(explanationPosition!.y).toBeGreaterThanOrEqual(diagramPosition!.y + diagramPosition!.height);
    await inspector.getByText("Technical details and resource readings", { exact: true }).click();
    await expect(inspector.getByText("Lookup CPU overhead")).toBeVisible();
    await page.getByRole("button", { name: "Close inspector" }).click();
    await expect(cache).toBeFocused();
    await expect(page.getByLabel("Request journey")).toBeVisible();
    const original = await page.getByTestId("completed-value").getAttribute("data-value");
    await page.getByLabel("Enable cache").check();
    await page.getByLabel("API replicas", { exact: true }).selectOption("4");
    await expect(cache).toContainText("Off");
    await expect(page.locator("#topology-api")).toContainText("1 copy");
    await expect(page.getByTestId("completed-value")).toHaveAttribute("data-value", original!);
    await expect(page.getByText("Inputs edited.", { exact: false })).toBeVisible();
    await page.getByRole("button", { name: "Run experiment", exact: true }).click();
    await expect(page.getByTestId("run-status")).toHaveText("finished");
    await expect(page.locator("#topology-cache")).toContainText("On");
    await expect(page.locator("#topology-api")).toContainText("4 copies");
    await expect(page.getByRole("figure", {name: "Request and response paths"})).toContainText("80% of cacheable reads");
    await page.locator("#topology-api").click();
    const resources = page.getByRole("figure", {name: "API copies share one database"});
    await expect(resources.locator(".replica-tile")).toHaveCount(4);
    await expect(resources.locator(".service-slot")).toHaveCount(4);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("button", { name: "Close inspector" }).click();
    await page.getByText("Run settings and measurement evidence", { exact: true }).click();
    await expect(page.getByTestId("reference-config")).toBeVisible();
    const positions = await page.locator(".experiment-grid").evaluate(el => {
      const controls = el.querySelector(".controls")!;
      const results = el.querySelector(".results-column")!;
      return { controls: controls.getBoundingClientRect().toJSON(), results: results.getBoundingClientRect().toJSON(), order: !!(controls.compareDocumentPosition(results) & Node.DOCUMENT_POSITION_FOLLOWING) };
    });
    expect(positions.order).toBe(true);
    if (width < 900) expect(positions.results.top).toBeGreaterThan(positions.controls.bottom);
    else expect(positions.results.left).toBeGreaterThan(positions.controls.left);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/beginner-${width}.png`, fullPage: true });
  });
}
