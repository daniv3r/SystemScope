import { expect, test } from "@playwright/test";
for (const width of [360, 1280])
  test(`keyboard, focus, reduced motion and chart evidence at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("./");
    await expect(page.getByTestId("virtual-time")).toHaveText("60.00 s");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({path:`test-results/explore-${width}.png`,fullPage:true});
    await page.getByRole("button", { name: /^Assumptions/ }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: /^Assumptions/ }),
    ).toBeFocused();
    await page.getByLabel("Pause motion").check();
    await page.getByRole("button", {name:"Start guided lesson"}).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("virtual-time")).toHaveText("5.00 s");
    await expect(page.getByRole("button",{name:"Return to Explore"})).toBeFocused();
    await page.getByRole("button", { name: "Step 10 ms" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("virtual-time")).toHaveText("5.01 s");
    await page.getByRole("button",{name:"Show charts",exact:true}).focus();
    await page.keyboard.press("Enter");
    await page.getByText("Read chart values as a table").click();
    await expect(page.getByRole("table")).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "p95 ms" }),
    ).toBeVisible();
    await page.getByRole("button",{name:"Hide charts",exact:true}).click();
    await expect(page.getByRole("table")).toHaveCount(0);
    await expect(page.getByRole("button",{name:"Show charts",exact:true})).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
