module.exports = {
	clearMocks : true,
	testMatch : [ '<rootDir>/*.test.js' ],
	collectCoverageFrom : [
		'*.js',
		'!**/node_modules/**',
		'!**/*.test.js',
		'!jest.config.js',
		'!<rootDir>/coverage/**',
	],
};
