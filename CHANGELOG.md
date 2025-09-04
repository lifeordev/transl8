# Changelog

All notable changes to the "transl8" extension will be documented in this file.

---

## [1.1.1] - 2025-09-04
### Fixed

- Hover previews for translation keys now correctly appear on function calls that include additional arguments, such as interpolation objects (e.g., `t('greeting', { name: 'World' })`).


## [1.1.0] - 2025-09-04

### Added
- **Live Diagnostics:** Implemented real-time checking for missing translation keys.
- **Problem Reporting:** Missing keys are now automatically underlined and added to the VS Code "Problems" panel for easy tracking and review. ✅

---

## [1.0.0]

- Initial release