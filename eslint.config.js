import js from "@eslint/js";
import ts from "typescript-eslint";
import hooks from "eslint-plugin-react-hooks";
export default ts.config(
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      ".routing/**",
      "coverage/**",
      "test-results/**",
      "playwright-report/**",
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: { "@typescript-eslint/no-explicit-any": "error" },
  },
  {
    files: ["src/**/*.tsx"],
    plugins: { "react-hooks": hooks },
    rules: hooks.configs.recommended.rules,
  },
  {
    files: ["src/simulation/**/*.ts"],
    rules: {
      "no-restricted-globals": [
        "error",
        "window",
        "document",
        "localStorage",
        "fetch",
        "performance",
        "setTimeout",
        "setInterval",
        "Date",
      ],
      "no-restricted-properties": [
        "error",
        { object: "Math", property: "random" },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "react",
            "react-dom",
            "../app/*",
            "../worker/*",
            "../components/*",
          ],
        },
      ],
    },
  },
  {
    files: ["scripts/*.mjs", "eslint.config.js"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly",
        URL: "readonly",
      },
    },
  },
);
