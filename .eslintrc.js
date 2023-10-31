module.exports = {
  root: true,
  ignorePatterns: [
    "**/__tests__/**/*.*",
    "**/node_modules/**/*.*",
    "**/coverage/**/*.*"
  ],
  overrides: [
    {
      files: ["*.ts"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project: ["tsconfig.json", "./packages/**/tsconfig.json"]
      },
      plugins: [
        "eslint-plugin-import",
        "@typescript-eslint",
        "prettier"
      ],
      extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "prettier",
        "plugin:json/recommended"
      ],
      rules: {
        "prettier/prettier": ["error"],
        "spaced-comment": ["error", "always", { "markers": ["/"] }],
        "@typescript-eslint/naming-convention": [
          "error",
          {selector: "default", format: ["camelCase"]},
          {
            selector: [
              "classProperty", "parameterProperty", "objectLiteralProperty",
              "classMethod", "parameter"
            ],
            format: ["camelCase"], leadingUnderscore: "allow"
          },
          //variable must be in camel or upper case
          {selector: "variable", format: ["camelCase", "UPPER_CASE"], leadingUnderscore: "allow"},
          //classes and types must be in PascalCase
          {selector: ["typeLike", "enum"], format: ["PascalCase"]},
          {selector: "enumMember", format: null},
          //ignore rule for quoted stuff
          {
            selector: [
              "classProperty",
              "objectLiteralProperty",
              "typeProperty",
              "classMethod",
              "objectLiteralMethod",
              "typeMethod",
              "accessor",
              "enumMember"
            ],
            format: null,
            modifiers: ["requiresQuotes"]
          },
          //ignore rules on destructured params
          {
            selector: "variable",
            modifiers: ["destructured"],
            format: null
          }
        ],
        "@typescript-eslint/explicit-module-boundary-types": "error",
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/no-require-imports": "error",
        "@typescript-eslint/no-unused-vars": ["error", {
          "varsIgnorePattern": "^_",
          "argsIgnorePattern": "^_",
        }],
        "@typescript-eslint/no-floating-promises": "error",
        "import/no-extraneous-dependencies": ["error", {
          "devDependencies": false,
          "optionalDependencies": true,
          "peerDependencies": false
        }],
        "import/order": [
          "error",
          {
            "groups": [["index", "sibling", "parent", "internal"], ["external", "builtin"], "object"],
            "newlines-between": "always"
          }
        ]
      },
    },
    {
      files: ["**/__tests__/**/*.ts", "*.spec.ts"],
      rules: {
        "import/no-extraneous-dependencies": "off"
      }
    },
    {
      files: ["*.d.ts"],
      rules: {
        "@typescript-eslint/triple-slash-reference": "off"
      }
    },
    {
      files: ["*.json"],
      extends: ["plugin:json/recommended"],
    }
  ]
};
