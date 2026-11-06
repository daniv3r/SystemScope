import { expect, test } from "@playwright/test";
test("static routing, worker, chart chunks and no service calls", async ({
  page,
  baseURL,
}) => {
  const errors: string[] = [];
  const missing: string[] = [];
  const requests: { url: string; kind: string }[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (e) => {
    if (e.type() === "error") errors.push(e.text());
  });
  page.on("response", (r) => {
    if (r.status() >= 400) missing.push(`${r.status()} ${r.url()}`);
  });
  page.on("request", (r) =>
    requests.push({ url: r.url(), kind: r.resourceType() }),
  );
  await page.goto("./");
  await expect(page).toHaveTitle("SystemScope — Your App Just Went Viral");
  await expect(page.getByTestId("virtual-time")).toHaveText("60.00 s");
  await expect(page.getByRole("heading", {name:"Traffic in, work out"})).toHaveCount(0);
  await page.getByRole("button", {name:"Show charts",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Traffic in, work out"})).toBeVisible();
  await page.reload();
  await expect(page.getByTestId("virtual-time")).toHaveText("60.00 s");
  await page.getByRole("button", { name: "Start guided lesson" }).click();
  await expect(page.getByTestId("virtual-time")).toHaveText("5.00 s");
  await page.getByRole("button", { name: "Return to Explore" }).click();
  await expect(page.getByTestId("virtual-time")).toHaveText("0.00 s");
  await page.getByRole("button", { name: "Step 10 ms" }).click();
  await expect(page.getByTestId("virtual-time")).toHaveText("0.01 s");
  const base = new URL(baseURL!);
  expect(errors).toEqual([]);
  expect(missing).toEqual([]);
  for (const r of requests) {
    expect(new URL(r.url).origin).toBe(base.origin);
    expect(new URL(r.url).pathname.startsWith(base.pathname)).toBe(true);
    expect(["fetch", "xhr", "eventsource"].includes(r.kind)).toBe(false);
  }
  expect(requests.some((r) => /simulation\.worker-.*\.js/.test(r.url))).toBe(
    true,
  );
});
