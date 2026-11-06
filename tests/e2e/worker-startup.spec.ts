import { expect, test } from "@playwright/test";
test("actual bundled worker computes baseline without runtime services", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));
  await page.goto("./");
  await expect(page.getByTestId("virtual-time")).toHaveText("60.00 s");
  expect(
    Number(
      await page.getByTestId("completed-value").getAttribute("data-value"),
    ),
  ).toBeGreaterThan(95);
  expect(errors).toEqual([]);
  expect(requests.some((u) => /worker.*\.js/.test(u))).toBe(true);
});
