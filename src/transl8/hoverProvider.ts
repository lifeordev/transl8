import * as vscode from "vscode";
import { getConfigForUri } from "./configuration";
import { loadTranslations } from "./translationManager";

export function registerHoverProvider(): vscode.Disposable {
  return vscode.languages.registerHoverProvider(
    ["javascript", "typescript", "vue"],
    {
      provideHover(
        document: vscode.TextDocument,
        position: vscode.Position
      ): vscode.ProviderResult<vscode.Hover> {
        const config = getConfigForUri(document.uri);
        if (!config || config.targetFunctionNames.length === 0) {
          return undefined;
        }
        const translations = loadTranslations(config.absoluteTranslationPath);

        const functionNamesRegexPart = config.targetFunctionNames
          .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
          .join("|");
        const keyRegex = new RegExp(
          `(?:${functionNamesRegexPart})\\s*\\(\\s*['"]([^'"]+)['"]\\s*[,)]`,
          "g"
        );

        const lineText = document.lineAt(position.line).text;
        let match;
        while ((match = keyRegex.exec(lineText)) !== null) {
          const key = match[1];
          const start = match.index + match[0].indexOf(key);
          const end = start + key.length;

          if (position.character >= start && position.character <= end) {
            // ... (warning message logic remains the same)

            // Pass the document URI string as the second argument to the command.
            const args = [key, document.uri.toString()];
            const encodedArgs = encodeURIComponent(JSON.stringify(args));
            const commandUri = vscode.Uri.parse(
              `command:lifeordev.transl8.editTranslation?${encodedArgs}`
            );

            // ... (rest of the markdown building logic remains the same)
            // (No changes needed for the markdown generation part)

            const translationData = translations.get(key);
            const markdownString = new vscode.MarkdownString("", true);
            markdownString.isTrusted = true;
            markdownString.supportThemeIcons = true;
            // ... rest of your excellent markdown generation code ...
            const minWidth = 60;
            const paddingNeeded = Math.max(0, minWidth - key.length);
            const minWidthSpacer = "&nbsp;".repeat(paddingNeeded);
            markdownString.appendMarkdown(`${key}${minWidthSpacer}\n`);
            if (translationData) {
              const [translation, context] = translationData;
              const table = `
| | |
|:---|:---|
| **Value** | ${translation} |
| **Context** | ${context ?? "_No comment provided._"} |
`;
              markdownString.appendMarkdown(table);
              markdownString.appendMarkdown(`\n---\n`);
              markdownString.appendMarkdown(
                `[$(edit) Edit Translation](${commandUri})`
              );
            } else {
              markdownString.appendMarkdown(
                `$(info) No translation found for this key.\n`
              );
              markdownString.appendMarkdown(`\n---\n`);
              markdownString.appendMarkdown(
                `[$(add) Add Translation](${commandUri})`
              );
            }
            return new vscode.Hover(markdownString);
          }
        }
        return undefined;
      },
    }
  );
}
