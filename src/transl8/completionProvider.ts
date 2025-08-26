import * as vscode from "vscode";

/**
 * Registers the completion item provider to suggest translation keys.
 * @param translations A map holding the current translation key/value pairs.
 * @param targetFunctionNames An array of function names that trigger completions.
 * @param absoluteSourceCodePath The absolute path to the source code directory to activate in.
 */
export function registerCompletionProvider(
  translations: Map<string, [string, string?]>,
  targetFunctionNames: string[],
  absoluteSourceCodePath: string | undefined
): vscode.Disposable {
  return vscode.languages.registerCompletionItemProvider(
    // Target languages for the provider
    ["javascript", "typescript", "vue"],
    {
      provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
      ): vscode.ProviderResult<vscode.CompletionItem[]> {
        // 1. Abort if the provider is not configured or not in the right folder
        if (
          targetFunctionNames.length === 0 ||
          !absoluteSourceCodePath ||
          !document.uri.fsPath.startsWith(absoluteSourceCodePath)
        ) {
          return undefined;
        }

        // 2. Get the line's text up to the cursor
        const linePrefix = document
          .lineAt(position.line)
          .text.substring(0, position.character);

        // 3. Create a regex to check if the cursor is inside a target function call
        const functionNamesRegexPart = targetFunctionNames
          .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) // Escape special characters
          .join("|");
        // This regex checks if the text ends with something like `t('` or `t("`
        const regex = new RegExp(
          `(?:${functionNamesRegexPart})\\s*\\(\\s*['"]$`
        );

        if (!regex.test(linePrefix)) {
          return undefined;
        }

        // 4. If the context is correct, provide all translation keys as completion items
        const translationKeys = Array.from(translations.keys());

        return translationKeys.map((key) => {
          const item = new vscode.CompletionItem(
            key,
            vscode.CompletionItemKind.Value
          );
          const translationData = translations.get(key);
          const translationValue = translationData ? translationData[0] : "N/A";

          item.detail = `Transl8 Key`;
          item.documentation = new vscode.MarkdownString(
            `**Translation:** \`${translationValue}\``
          );

          return item;
        });
      },
    },
    "'", // Trigger completions when the user types a single quote
    '"' // Trigger completions when the user types a double quote
  );
}
