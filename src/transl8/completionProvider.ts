import * as vscode from "vscode";
import { getConfigForUri } from "./configuration";
import { loadTranslations } from "./translationManager";

export function registerCompletionProvider(): vscode.Disposable {
  return vscode.languages.registerCompletionItemProvider(
    ["javascript", "typescript", "vue"],
    {
      provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
      ): vscode.ProviderResult<vscode.CompletionItem[]> {
        const config = getConfigForUri(document.uri);
        console.log(config);

        // Abort if not configured, no functions to target, or not in the right source folder
        if (
          !config ||
          config.targetFunctionNames.length === 0 ||
          !config.absoluteSourceCodePath ||
          !document.uri.fsPath.startsWith(config.absoluteSourceCodePath)
        ) {
          return undefined;
        }

        const translations = loadTranslations(config.absoluteTranslationPath);
        const linePrefix = document
          .lineAt(position.line)
          .text.substring(0, position.character);

        const functionNamesRegexPart = config.targetFunctionNames
          .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
          .join("|");
        const regex = new RegExp(
          `(?:${functionNamesRegexPart})\\s*\\(\\s*['"]$`
        );

        if (!regex.test(linePrefix)) {
          return undefined;
        }

        return Array.from(translations.keys()).map((key) => {
          const item = new vscode.CompletionItem(
            key,
            vscode.CompletionItemKind.Value
          );
          const translationData = translations.get(key);
          item.detail = `Transl8 Key`;
          item.documentation = new vscode.MarkdownString(
            `**Translation:** \`${
              translationData ? translationData[0] : "N/A"
            }\``
          );
          return item;
        });
      },
    },
    "'",
    '"'
  );
}
