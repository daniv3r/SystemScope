import { rm } from "node:fs/promises";
import { spawn } from "node:child_process";
const run = (command, args, env = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: { ...process.env, ...env },
    });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(Error(`${command} exited ${code}`)),
    );
  });
for (const [name, base] of [
  ["root", "/"],
  ["repo", "/SystemScope/"],
]) {
  const output = `.routing/${name}`;
  await run("npm", ["run", "build", "--", "--base", base, "--outDir", output]);
  await run(
    "npx",
    [
      "playwright",
      "test",
      "--project=chromium",
      "--output",
      `.routing/results-${name}`,
      "tests/e2e/static-routing.spec.ts",
      "tests/e2e/explore-first.spec.ts",
      "tests/e2e/scaling-remedies.spec.ts",
    ],
    { TEST_BASE: base, STATIC_ROOT: output, CI: "1" },
  );
}

await rm(".routing", { recursive: true, force: true });
