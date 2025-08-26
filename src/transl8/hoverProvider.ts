import * as vscode from "vscode";

/**
 * Registers the hover provider to show translation details.
 * @param translations A map holding the current translation key/value pairs.
 * @param targetFunctionNames An array of function names that trigger the hover.
 */
export function registerHoverProvider(
  translations: Map<string, [string, string?]>,
  targetFunctionNames: string[]
): vscode.Disposable {
  return vscode.languages.registerHoverProvider(
    // Target languages for the provider
    ["javascript", "typescript", "vue"],
    {
      provideHover(
        document: vscode.TextDocument,
        position: vscode.Position
      ): vscode.ProviderResult<vscode.Hover> {
        if (targetFunctionNames.length === 0) {
          return undefined;
        }

        const functionNamesRegexPart = targetFunctionNames
          .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
          .join("|");
        const keyRegex = new RegExp(
          `(?:${functionNamesRegexPart})\\s*\\(\\s*['"]([^'"]+)['"]\\s*\\)`,
          "g"
        );

        const lineText = document.lineAt(position.line).text;

        let match;
        while ((match = keyRegex.exec(lineText)) !== null) {
          const key = match[1];
          const start = match.index + match[0].indexOf(key);
          const end = start + key.length;

          if (position.character >= start && position.character <= end) {
            // Check if key is a substring prefix of another key
            for (const existingKey of translations.keys()) {
              if (existingKey !== key && existingKey.startsWith(key + ".")) {
                const warning = new vscode.MarkdownString(
                  `$(warning) **Cannot show translation for "${key}" because a more specific key "${existingKey}" exists.**\n\nPlease edit or remove the more specific key first.`
                );
                warning.isTrusted = true;
                return new vscode.Hover(warning);
              }
            }

            const translationData = translations.get(key);

            // 4. Create the command URI
            const args = [key];
            const encodedArgs = encodeURIComponent(JSON.stringify(args));
            const commandUri = vscode.Uri.parse(
              `command:lifeordev.transl8.editTranslation?${encodedArgs}`
            );

            // 5. Build the rich hover content using Markdown
            const markdownString = new vscode.MarkdownString("", true); // Enable markdown parsing
            markdownString.isTrusted = true;
            markdownString.supportThemeIcons = true;

            // Define a minimum width for the hover, in character equivalents.
            const minWidth = 60;
            // Calculate the necessary padding to meet the minimum width.
            const paddingNeeded = Math.max(0, minWidth - key.length);
            const minWidthSpacer = "&nbsp;".repeat(paddingNeeded);

            markdownString.appendMarkdown(`${key}${minWidthSpacer}\n`);

            if (translationData) {
              const [translation, context] = translationData;

              // Build the table for value and context
              const table = `
| | |
|:---|:---|
| **Value** | ${translation} |
| **Context** | ${context ?? "_No comment provided._"} |
`;
              markdownString.appendMarkdown(table);

              // Action link
              markdownString.appendMarkdown(`\n---\n`);
              markdownString.appendMarkdown(
                `[$(edit) Edit Translation](${commandUri})`
              );
            } else {
              // Updated message for a missing key (key itself is omitted)
              markdownString.appendMarkdown(
                `$(info) No translation found for this key.\n`
              );

              // Action link
              markdownString.appendMarkdown(`\n---\n`);
              markdownString.appendMarkdown(
                `[$(add) Add Translation](${commandUri})`
              );
            }

            return new vscode.Hover(markdownString);
          }
        }
        return undefined; // No key found at this position
      },
    }
  );
}
