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

            // 4. Create the command URI to pass the key to the edit command
            const args = [key];
            const encodedArgs = encodeURIComponent(JSON.stringify(args));
            const editCommandUri = vscode.Uri.parse(
              `command:lifeordev.transl8.editTranslation?${encodedArgs}`
            );

            // 5. Build the rich hover content using Markdown
            const markdownString = new vscode.MarkdownString();
            markdownString.isTrusted = true; // Allow commands to be executed

            if (translationData) {
              const [translation, context] = translationData;
              markdownString.appendMarkdown(
                `**Transl8** &nbsp; [✏️ Edit](${editCommandUri})\n\n`
              );
              markdownString.appendMarkdown(`*Key:* \`${key}\`\n\n`);
              markdownString.appendCodeblock(translation, "plaintext");
              markdownString.appendMarkdown(
                `\n\n*Context:* ${context ?? "_No comment provided._"}`
              );
            } else {
              markdownString.appendMarkdown(
                `**Transl8** &nbsp; [✏️ Add Translation](${editCommandUri})\n\n`
              );
              markdownString.appendMarkdown(
                `No translation found for key: \`${key}\``
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
