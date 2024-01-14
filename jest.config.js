export default {
	preset    : 'ts-jest/presets/default-esm',
	transform : {
		'\\.[jt]sx?$' : [
			'ts-jest', {
				useESM   : true,
				tsconfig : '<rootDir>/tsconfig.test.json',
			},
		],
	},
	moduleNameMapper : {
		'(.+)\\.js' : '$1',
	},

	clearMocks : true,

	roots     : [ '<rootDir>/src' ],
	testMatch : [ '<rootDir>/src/**/__tests__/*.test.ts' ],

	collectCoverageFrom : [
		'<rootDir>/src/**/*.ts',
		'!<rootDir>/src/**/*.d.ts',
		'!<rootDir>/src/*.ts',
		'!<rootDir>/src/types/*.ts',

		'!**/node_modules/**',
		'!**/__tests__/**',

		'!<rootDir>/coverage/**',
		'!<rootDir>/dist/**',
	],
};
