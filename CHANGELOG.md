# Changelog


---

## [1.2.4] - 2025-09-04

### Fixed

- Improved the accuracy of the hover provider to prevent it from incorrectly activating on functions that are not translation functions. For example, it will no longer trigger on `split('.')` if your translation function is named `t`.

## [1.2.1] - 2025-09-04

### Fixed

- Hover previews for translation keys now correctly appear on function calls that include additional arguments, such as interpolation objects (e.g., `t('greeting', { name: 'World' })`).


## [1.2.0] - 2025-09-04

### Added
- **Live Diagnostics:** Implemented real-time checking for missing translation keys.
- **Problem Reporting:** Missing keys are now automatically underlined and added to the VS Code "Problems" panel for easy tracking and review. ✅
