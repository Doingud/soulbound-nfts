module.exports = {
  env: {
    browser: false,
    es2021: true,
    mocha: true,
    node: true
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "standard",
    // 'plugin:prettier/recommended',
    "plugin:node/recommended",
    "prettier"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 12
  },
  rules: {
    "node/no-unsupported-features/es-syntax": [
      "error",
      { ignores: ["modules"] }
    ],
    "node/no-missing-import": ["off"],
    "no-unused-vars": ["warn"],
    "node/no-unpublished-import": ["off"],
    "node/no-extraneous-import": ["off"]
  }
};
