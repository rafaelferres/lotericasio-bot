module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "plugin:@typescipt-eslint/recommended",
    "prettier/@typescript-eslint",
    "standard",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
  },
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
  },
  plugins: ["@typescript-eslint", "prettier"],
  rules: {
    "prettier/prettier": "error",
  },
};
