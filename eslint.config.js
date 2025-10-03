const {
    defineConfig,
    globalIgnores,
} = require("eslint/config");

const html = require("eslint-plugin-html");
const htmlEslint = require("@html-eslint/eslint-plugin");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const typescriptParser = require("@typescript-eslint/parser");
const parser = require("@html-eslint/parser");
const globals = require("globals");
const js = require("@eslint/js");

const {
    FlatCompat,
} = require("@eslint/eslintrc");

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

module.exports = defineConfig([{
    plugins: {
        html,
        "@html-eslint": htmlEslint,
        "@typescript-eslint": typescriptEslint,
    },

    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.mocha,
        },

        "ecmaVersion": 2021,
        "sourceType": "module",
        parserOptions: {},
    },

    extends: compat.extends(
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
    ),

    "rules": {
        "accessor-pairs": "error",
        "array-bracket-newline": "error",
        "array-bracket-spacing": ["error", "never"],
        "array-callback-return": "off",
        "array-element-newline": "off",
        "arrow-body-style": "error",
        "arrow-parens": ["error", "as-needed"],

        "arrow-spacing": ["error", {
            "after": true,
            "before": true,
        }],

        "block-scoped-var": "error",
        "block-spacing": "error",
        "brace-style": ["error", "1tbs"],
        "callback-return": "error",
        "camelcase": "error",
        "capitalized-comments": "off",
        "class-methods-use-this": "off",
        "comma-dangle": "error",

        "comma-spacing": ["error", {
            "after": true,
            "before": false,
        }],

        "comma-style": ["error", "last"],
        "complexity": "off",
        "computed-property-spacing": ["error", "never"],
        "consistent-return": "off",
        "consistent-this": "error",
        "curly": "off",
        "default-case": "off",
        "dot-location": ["error", "property"],

        "dot-notation": ["error", {
            "allowKeywords": true,
        }],

        "eol-last": "error",
        "eqeqeq": "off",
        "func-call-spacing": "error",
        "func-name-matching": "error",
        "func-names": ["error", "never"],
        "func-style": ["error", "expression"],
        "function-paren-newline": "off",
        "generator-star-spacing": "error",
        "global-require": "error",
        "guard-for-in": "error",
        "handle-callback-err": "error",
        "id-blacklist": "error",
        "id-length": "off",
        "id-match": "error",
        "implicit-arrow-linebreak": ["error", "beside"],
        "indent": "error",
        "indent-legacy": "off",
        "init-declarations": "off",
        "jsx-quotes": "error",
        "key-spacing": "error",

        "keyword-spacing": ["error", {
            "after": true,
            "before": true,
        }],

        "line-comment-position": "off",
        "linebreak-style": ["error", "unix"],
        "lines-around-comment": "off",
        "lines-around-directive": "error",
        "lines-between-class-members": ["error", "always"],
        "max-classes-per-file": "error",
        "max-depth": "off",
        "max-len": "off",
        "max-lines": "off",
        "max-lines-per-function": "off",
        "max-nested-callbacks": "error",
        "max-params": "off",
        "max-statements": "off",
        "max-statements-per-line": "error",
        "multiline-comment-style": "off",
        "multiline-ternary": ["error", "always-multiline"],
        "new-cap": "error",
        "new-parens": "error",
        "newline-after-var": "off",
        "newline-before-return": "off",
        "newline-per-chained-call": "off",
        "no-alert": "off",
        "no-array-constructor": "error",
        "no-async-promise-executor": "error",
        "no-await-in-loop": "error",
        "no-bitwise": "off",
        "no-buffer-constructor": "error",
        "no-caller": "error",
        "no-catch-shadow": "error",
        "no-confusing-arrow": "off",
        "no-continue": "error",
        "no-div-regex": "error",
        "no-duplicate-imports": "error",
        "no-else-return": "error",
        "no-empty-function": "error",
        "no-eq-null": "error",
        "no-eval": "error",
        "no-extend-native": "error",
        "no-extra-bind": "error",
        "no-extra-label": "error",
        "no-extra-parens": "off",
        "no-floating-decimal": "error",
        "no-implicit-globals": "error",
        "no-implied-eval": "error",
        "no-inline-comments": "off",
        "no-invalid-this": "off",
        "no-iterator": "error",
        "no-label-var": "error",
        "no-labels": "error",
        "no-lone-blocks": "error",
        "no-lonely-if": "off",
        "no-loop-func": "error",
        "no-magic-numbers": "off",
        "no-misleading-character-class": "error",

        "no-mixed-operators": ["error", {
            "allowSamePrecedence": true,
        }],

        "no-mixed-requires": "error",
        "no-multi-assign": "off",
        "no-multi-spaces": "error",
        "no-multi-str": "error",
        "no-multiple-empty-lines": "error",
        "no-native-reassign": "error",
        "no-negated-condition": "off",
        "no-negated-in-lhs": "error",
        "no-nested-ternary": "off",
        "no-new": "off",
        "no-new-func": "error",
        "no-new-object": "error",
        "no-new-require": "error",
        "no-new-wrappers": "error",
        "no-octal-escape": "error",
        "no-param-reassign": "off",
        "no-path-concat": "error",
        "no-plusplus": "off",
        "no-process-env": "error",
        "no-process-exit": "error",
        "no-proto": "error",
        "no-prototype-builtins": "off",
        "no-restricted-globals": "error",
        "no-restricted-imports": "error",
        "no-restricted-modules": "error",
        "no-restricted-properties": "error",
        "no-restricted-syntax": "error",
        "no-return-assign": "error",
        "no-return-await": "error",
        "no-script-url": "error",
        "no-self-compare": "error",
        "no-sequences": "error",
        "no-shadow": "off",
        "no-shadow-restricted-names": "error",
        "no-spaced-func": "error",
        "no-sync": "error",
        "no-tabs": "error",
        "no-template-curly-in-string": "error",
        "no-ternary": "off",
        "no-throw-literal": "error",
        "no-trailing-spaces": "error",
        "no-undef-init": "error",
        "no-undefined": "off",
        "no-underscore-dangle": "off",
        "no-unmodified-loop-condition": "error",
        "no-unneeded-ternary": "error",
        "no-unused-expressions": "error",
        "no-unused-vars": "off",
        "no-use-before-define": "error",
        "no-useless-call": "error",
        "no-useless-computed-key": "error",
        "no-useless-concat": "error",
        "no-useless-constructor": "error",
        "no-useless-rename": "error",
        "no-useless-return": "error",
        "no-var": "error",
        "no-void": "error",
        "no-warning-comments": "off",
        "no-whitespace-before-property": "error",
        "no-with": "error",
        "nonblock-statement-body-position": ["error", "any"],
        "object-curly-newline": "error",
        "object-curly-spacing": ["error", "never"],
        "object-property-newline": "error",
        "object-shorthand": "error",
        "one-var": "off",
        "one-var-declaration-per-line": "error",
        "operator-assignment": "off",
        "operator-linebreak": ["error", "after"],
        "padded-blocks": "off",
        "padding-line-between-statements": "error",
        "prefer-arrow-callback": "error",
        "prefer-const": "error",
        "prefer-destructuring": "off",
        "prefer-numeric-literals": "error",
        "prefer-object-spread": "error",
        "prefer-promise-reject-errors": "error",
        "prefer-reflect": "off",
        "prefer-rest-params": "off",
        "prefer-spread": "error",
        "prefer-template": "error",
        "quote-props": "off",
        "quotes": "error",
        "radix": ["error", "always"],
        "require-atomic-updates": "error",
        "require-await": "error",

        "require-unicode-regexp": "off",
        "rest-spread-spacing": "error",
        "semi": ["error", "never"],

        "semi-spacing": ["error", {
            "after": true,
            "before": false,
        }],

        "semi-style": ["error", "last"],
        "sort-imports": "off",
        "sort-keys": "off",
        "sort-vars": "error",
        "space-before-blocks": "error",
        "space-before-function-paren": "off",
        "space-in-parens": "off",
        "space-infix-ops": "off",
        "space-unary-ops": "error",
        "spaced-comment": "off",
        "strict": "error",
        "switch-colon-spacing": "error",
        "symbol-description": "error",
        "template-curly-spacing": ["error", "never"],
        "template-tag-spacing": "error",
        "unicode-bom": ["error", "never"],
        "valid-jsdoc": "off",
        "vars-on-top": "error",
        "wrap-iife": "error",
        "wrap-regex": "off",
        "yield-star-spacing": "error",
        "yoda": "off",

        "@typescript-eslint/no-explicit-any": ["warn", {
            "ignoreRestArgs": true,
        }],

        "@typescript-eslint/no-unused-vars": ["error", {
            "argsIgnorePattern": "^_",
        }],

        "@typescript-eslint/no-unsafe-function-type": "off",
        "@typescript-eslint/ban-types": "off",
    },
}, {
    files: ["**/*.ts", "**/*.tsx"],

    languageOptions: {
        parser: typescriptParser,
    },
}, {
    files: ["**/*.html"],

    languageOptions: {
        parser: parser,
    },

    extends: compat.extends("plugin:@html-eslint/recommended"),
    
    rules: {
        "indent": "off",
        "no-mixed-spaces-and-tabs": "off",
        "no-trailing-spaces": "off",
    },
}, {
    files: ["**/*.mjs"],
}, {
    files: ["docs/demos/**/*.html"],
    rules: {
        "func-style": "off",
        "indent": "off",
        "no-use-before-define": "off",
        "radix": "off",
        "no-new-func": "off",
        "implicit-arrow-linebreak": "off"
    }
}, {
    files: ["test/**/*.html"],
    rules: {
        "func-style": "off",
        "indent": "off",
        "no-use-before-define": "off",
        "radix": "off",
        "no-new-func": "off",
        "implicit-arrow-linebreak": "off",
        "no-mixed-spaces-and-tabs": "off",
        "no-trailing-spaces": "off",
        "quotes": "off",
        "semi": "off"
    }
}, globalIgnores(["docs/demos/dist/"])]);
