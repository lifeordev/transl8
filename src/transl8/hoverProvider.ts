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

        // 1. Create a dynamic regex from the configured function names
        const functionNamesRegexPart = targetFunctionNames
          .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) // Escape special regex characters
          .join("|");
        const keyRegex = new RegExp(
          `(?:${functionNamesRegexPart})\\s*\\(\\s*['"]([^'"]+)['"]\\s*\\)`,
          "g"
        );

        const lineText = document.lineAt(position.line).text;

        // 2. Find all matches on the current line
        let match;
        while ((match = keyRegex.exec(lineText)) !== null) {
          const key = match[1];
          // Calculate the precise start and end of the key within the quotes
          const start = match.index + match[0].indexOf(key);
          const end = start + key.length;

          // 3. Check if the hover position is within the bounds of a matched key
          if (position.character >= start && position.character <= end) {
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
            markdownString.supportHtml = true;

            // Define a minimum width for the hover, in character equivalents.
            const minWidth = 60;

            // Calculate the necessary padding to meet the minimum width.
            const paddingNeeded = Math.max(0, minWidth - key.length);
            const minWidthSpacer = "&nbsp;".repeat(paddingNeeded);

            // Use a styled span for the key. Font styling is added for extra safety.
            const styledKey = `<span style="color:var(--vscode-descriptionForeground); font-weight:normal;">${key}${minWidthSpacer}</span>`;

            markdownString.appendMarkdown(styledKey);

            // IMPORTANT: Add a non-breaking space on a new line.
            // This prevents the '---' below from turning the key into a giant heading.
            // markdownString.appendMarkdown("\n\n&nbsp;\n");

            markdownString.appendMarkdown(`\n`);

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
