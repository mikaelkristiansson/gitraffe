/** @type { import("eslint").Linter.Config } */
module.exports = {
	root: true,
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:svelte/recommended',
		'prettier'
	],
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint'],
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2020,
		extraFileExtensions: ['.svelte']
	},
	env: {
		browser: true,
		es2017: true,
		node: true
	},
	overrides: [
		{
			files: ['*.svelte'],
			parser: 'svelte-eslint-parser',
			parserOptions: {
				parser: '@typescript-eslint/parser'
			}
		}
	],
	rules: {
		'import/no-cycle': 'error',
		'import/order': [
			'error',
			{
				alphabetize: { order: 'asc', orderImportKind: 'asc', caseInsensitive: false },
				groups: ['index', 'sibling', 'parent', 'internal', 'external', 'builtin', 'object', 'type'],
				'newlines-between': 'never'
			}
		],
		'import/no-unresolved': [
			'error',
			{
				ignore: ['^\\$app', '^\\$env']
			}
		],
		'func-style': [2, 'declaration'],
		'svelte/no-at-html-tags': 'off',
		'@typescript-eslint/no-namespace': 'off',
		'@typescript-eslint/no-empty-function': 'off',
		'@typescript-eslint/no-explicit-any': 'off',
		'@typescript-eslint/no-unused-vars': [
			'error', // or "error"
			{
				argsIgnorePattern: '^_',
				varsIgnorePattern: '^_',
				caughtErrorsIgnorePattern: '^_'
			}
		],
		'no-return-await': 'off', // Required to be off for @typescript-eslint/return-await
		'@typescript-eslint/return-await': ['error', 'always'],
		'@typescript-eslint/promise-function-async': 'error',
		'@typescript-eslint/await-thenable': 'error'
	},
	settings: {
		'import/extensions': ['.ts'],
		'import/parsers': {
			'@typescript-eslint/parser': ['.ts']
		},
		'import/resolver': {
			typescript: {
				project: ['./tsconfig.json', './.svelte-kit/tsconfig.json']
			}
		}
	}
};
