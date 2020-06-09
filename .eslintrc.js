module.exports = {
  env: {
    es2020: true,
    node: true,
  },
  extends: [
    "plugin:@typescipt-eslint/recommended",
    "prettier/@typescript-eslint",
    "standard",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 11,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  rules: {},
};
