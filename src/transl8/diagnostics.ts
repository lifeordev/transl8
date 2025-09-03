// diagnostics.ts

import * as vscode from "vscode";
import { getConfigForUri } from "./configuration";
import { loadTranslations } from "./translationManager";

export const diagnosticCollection =
  vscode.languages.createDiagnosticCollection("transl8");

export function updateDiagnostics(document: vscode.TextDocument): void {
  const config = getConfigForUri(document.uri);

  if (
    !config ||
    !["javascript", "typescript", "vue"].includes(document.languageId)
  ) {
    diagnosticCollection.clear();
    return;
  }

  const translations = loadTranslations(config.absoluteTranslationPath);
  const diagnostics: vscode.Diagnostic[] = [];

  const functionNamesRegexPart = config.targetFunctionNames
    .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const keyRegex = new RegExp(
    `(?:${functionNamesRegexPart})\\s*\\(\\s*['"]([^'"]+)['"]\\s*\\)`,
    "g"
  );

  const text = document.getText();
  let match;
  while ((match = keyRegex.exec(text)) !== null) {
    const key = match[1];

    // Translation not found - create a diagnostic
    if (!translations.has(key)) {
      const keyIndex = match.index + match[0].indexOf(key);
      const startPosition = document.positionAt(keyIndex);
      const endPosition = document.positionAt(keyIndex + key.length);
      const range = new vscode.Range(startPosition, endPosition);

      const diagnostic = new vscode.Diagnostic(
        range,
        `No translation found for key: "${key}"`,
        vscode.DiagnosticSeverity.Error
      );

      diagnostic.source = "Transl8";
      diagnostics.push(diagnostic);
    }
  }

  diagnosticCollection.set(document.uri, diagnostics);
}
