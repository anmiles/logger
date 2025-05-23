# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [8.0.0](../../tags/v8.0.0) - 2025-05-18
__(BREAKING) Dropped support for NodeJS 18 (EOL). Minimum required version is now NodeJS 20.__

__(BREAKING) Option `showTime` is enabled by default__

### Changed
- Migrated to NodeJS 20.19
- Migrated to ESLint V9 flat configs
- Updated dependencies
- Option `showTime` is enabled by default

## [7.0.2](../../tags/v7.0.2) - 2024-03-20
### Changed
- Update dependencies

## [7.0.1](../../tags/v7.0.1) - 2024-03-16
### Changed
- Use dedicated .eslintignore

## [7.0.0](../../tags/v7.0.0) - 2024-03-16
### Changed
- Update eslint config and raise minimum supported NodeJS version to match one in typescript-eslint plugin
- Update .npmignore
- Unify jest.config.js by removing redundant patterns and providing support for both ts and tsx
### Removed
- Get rid of default export

## [6.0.3](../../tags/v6.0.3) - 2024-01-30
### Changed
- Migrate to GitHub

## [6.0.2](../../tags/v6.0.2) - 2024-01-29
### Changed
- Explicitly specify ignores from .gitignore in .eslintrc.js

## [6.0.1](../../tags/v6.0.1) - 2024-01-29
### Changed
- Explicitly specify ignores from .gitignore in .eslintrc.js

## [6.0.0](../../tags/v6.0.0) - 2024-01-15
### Changed
- Revert ESM

## [5.0.4](../../tags/v5.0.4) - 2024-01-14
### Added
- Add .npmignore

## [5.0.3](../../tags/v5.0.3) - 2024-01-14
### Changed
- Migrate to ESM
- Update dependencies

## [4.0.4](../../tags/v4.0.4) - 2024-01-03
### Changed
- Export methods in default export

## [4.0.3](../../tags/v4.0.3) - 2024-01-03
### Changed
- Re-export default export

## [4.0.2](../../tags/v4.0.2) - 2024-01-03
### Changed
- Export methods

## [4.0.1](../../tags/v4.0.1) - 2023-11-12
### Changed
- Update dependencies

## [4.0.0](../../tags/v4.0.0) - 2023-09-13
### Changed
- Update dependencies with breaking changes

## [3.0.0](../../tags/v3.0.0) - 2023-05-15
### Changed
- Add timestamp only if explicitly required

## [2.1.3](../../tags/v2.1.3) - 2023-05-08
### Changed
- Use shared eslint config * explicitly specify ignorePatterns

## [2.1.2](../../tags/v2.1.2) - 2023-05-07
### Added
- Fix exporting log functions

## [2.1.1](../../tags/v2.1.1) - 2023-05-07
### Changed
- Fix importing colorette for dist

## [2.1.0](../../tags/v2.1.0) - 2023-05-07
### Added
- Export log functions separately using default Logger instance

## [2.0.4](../../tags/v2.0.4) - 2023-05-07
### Changed
- Cleanup cSpell words
- Update `@anmiles/eslint-config`

## [2.0.3](../../tags/v2.0.3) - 2023-05-07
### Changed
- Fixed test cases for showDebug

## [2.0.2](../../tags/v2.0.2) - 2023-05-07
### Changed
- Fixed test coverage
goto 
## [2.0.1](../../tags/v2.0.1) - 2023-05-06
### Changed
- Added usage examples

## [2.0.0](../../tags/v2.0.0) - 2023-05-06
### Changed
- Use different console functions for different log severities

## [1.0.0](../../tags/v1.0.0) - 2023-05-06
### Changed
- First release
