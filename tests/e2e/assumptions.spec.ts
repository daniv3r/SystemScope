import { expect, test } from "@playwright/test";
test("assumptions are available without storage and explain model limits", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw Error("blocked");
      },
    });
  });
  await page.goto("./");
  await expect(page.getByTestId("virtual-time")).toHaveText("60.00 s");
  await page.getByRole("button", { name: /^Assumptions/ }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("not a production benchmark");
  await expect(dialog).toContainText("not actual JS process memory");
  await expect(dialog).toContainText("successful completions only");
  for (let i = 1; i <= 15; i++)
    await expect(dialog).toContainText(`A-${String(i).padStart(2, "0")}`);
  await page.getByRole("button", { name: "Close assumptions" }).click();
  await page.getByRole("button", { name: "Start guided lesson" }).click();
  await page.getByRole("button", { name: "Return to Explore" }).click();
  await expect(page.getByTestId("p95-value")).toHaveText("N/A");
});
