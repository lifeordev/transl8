# Transl8 - i18n Source File Helper

Transl8 is a powerful VS Code extension designed to streamline your internationalization (i18n) workflow. It helps you efficiently manage your **primary language source file** by providing instant feedback and editing capabilities directly within your code.

Stop switching between your code and your JSON files. With Transl8, your source translations are always just a hover away.

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/lifeordev.transl8?style=flat-square&label=Marketplace)](https://marketplace.visualstudio.com/items?itemName=lifeordev.transl8)

---

## How It Works

Transl8 is built to manage a **single source-of-truth** translation file (e.g., `en.json`). It helps you write and maintain the primary text and its context. The process of translating this source file into other languages (e.g., `de.json`, `es.json`) should be handled by a separate tool or workflow outside of this extension.

### JSON Structure

The extension expects each translation value to be an array (a tuple) where:

1.  The first item is the **translation string**.
2.  The second item (optional) is a **comment or context** for translators.

#### Example JSON Format

```json
{
  "warning": {
    "noUser": [
      "No Users Found",
      "Warning message if no users found, keep below 20 chars"
    ],
    "noAccess": ["You do not have permission to view this page."]
  }
}
```

## Features

- **Instant Hover Previews**: Hover over a translation key to see its value and the context/comment you've provided.
- **Quick Edit Command**: An "Edit" link in the hover tooltip lets you add or update the source translation and its context on the fly.
- **Key Autocompletion**: Get intelligent autocomplete suggestions for all your translation keys as soon as you start typing inside your translation function.
- **Nested JSON Support**: Works seamlessly with nested JSON translation files by flattening keys into dot-notation (e.g., `warning.noUser`).

---

## Configuration

To get started, you need to configure the extension in your workspace `settings.json` file.

Open your settings by going to **File > Preferences > Settings**, then click the "Workspace" tab. Search for "transl8" or edit your `.vscode/settings.json` file directly.

### Available Settings

- `lifeordev.transl8.translationFilePath`: **(Required)** The path to your primary JSON translation file.
- `lifeordev.transl8.functionNames`: **(Required)** An array of function names that you use for translations (e.g., `t`, `$t`, `translate`).
- `lifeordev.transl8.sourceCodePath`: **(Optional)** The path to your source code directory. Autocomplete will only activate for files within this path.

### Example `settings.json`

```json
{
  "lifeordev.transl8.translationFilePath": "./src/locales/en.json",
  "lifeordev.transl8.functionNames": ["t", "$t"],
  "lifeordev.transl8.sourceCodePath": "./src"
}
```

## Usage

Once configured, the extension will automatically activate.

1.  **See Translations**: Simply move your mouse over a key used inside one of your configured `functionNames` (e.g., `t('warning.noUser')`). A tooltip will appear with the translation and context.
2.  **Edit or Add Translations**: Click the "✏️ Edit" or "✏️ Add Translation" link in the tooltip. VS Code will prompt you for the new translation and an optional context comment.
3.  **Autocomplete Keys**: Inside a translation function, type a quote (`'` or `"`) to trigger autocomplete and see a list of all available keys.

## Contributing

Found a bug or have a feature request? Please open an issue on our [GitHub repository](https://github.com/lifeordev/transl8). Contributions are welcome!

## License

This extension is licensed under the [MIT License](https://github.com/lifeordev/transl8/blob/main/LICENSE).
