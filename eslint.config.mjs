import js from "@eslint/js";
import globals from "globals";
import { defineConfig, globalIgnores } from "eslint/config";
import jest from 'eslint-plugin-jest';
import importPlugin from 'eslint-plugin-import';

export default defineConfig([
  globalIgnores(['client', 'node_modules', 'playwright-report', 'coverage']),
  { 
    files: ["**/*.js"], 
    plugins: { js }, 
    extends: [js.configs.recommended, importPlugin.flatConfigs.recommended], 
    languageOptions: { 
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.jest,
      } 
    },
    rules: {
      "no-unused-vars": "warn",
    },
  },
  {
    files: ["**/*.test.js"],
    ...jest.configs['flat/recommended'],
  }
]);
