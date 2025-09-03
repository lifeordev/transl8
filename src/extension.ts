import * as vscode from "vscode";
import { registerEditTranslationCommand } from "./transl8/commands";
import { registerHoverProvider } from "./transl8/hoverProvider";
import { registerCompletionProvider } from "./transl8/completionProvider";
import { updateDiagnostics, diagnosticCollection } from "./transl8/diagnostics";

export function activate(context: vscode.ExtensionContext) {
  console.log("Transl8 extension is now active!");

  // Register all features. They are now self-sufficient and will get
  // configuration based on the active document.
  const editCommand = registerEditTranslationCommand();
  const hoverProvider = registerHoverProvider();
  const completionProvider = registerCompletionProvider();

  // Add all disposables to the extension's subscriptions.
  context.subscriptions.push(editCommand, hoverProvider, completionProvider);

  // Error Diagnostics
  let debounceTimer: NodeJS.Timeout;

  // Trigger initial diagnostics
  if (vscode.window.activeTextEditor) {
    updateDiagnostics(vscode.window.activeTextEditor.document);
  }
  // Trigger diagnostics when the active editor changes
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        updateDiagnostics(editor.document);
      }
    })
  );

  // Trigger diagnostics while the user is typing (debounced)
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        // We only want to run diagnostics on the document that was changed
        updateDiagnostics(event.document);
      }, 500); // debounce
    })
  );

  // Clear diagnostics when a document is closed
  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((doc) => {
      diagnosticCollection.delete(doc.uri);
    })
  );
}

export function deactivate() {}
