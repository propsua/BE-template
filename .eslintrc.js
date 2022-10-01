module.exports = {
  parserOptions: {
    ecmaVersion: 13,
  },
  extends: [
    'eslint:recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    commonjs: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
  },
};
