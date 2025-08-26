import * as vscode from "vscode";
import { registerEditTranslationCommand } from "./transl8/commands";
import { registerHoverProvider } from "./transl8/hoverProvider";
import { registerCompletionProvider } from "./transl8/completionProvider";

export function activate(context: vscode.ExtensionContext) {
  console.log("Transl8 extension is now active!");

  // Register all features. They are now self-sufficient and will get
  // configuration based on the active document.
  const editCommand = registerEditTranslationCommand();
  const hoverProvider = registerHoverProvider();
  const completionProvider = registerCompletionProvider();

  // Add all disposables to the extension's subscriptions.
  context.subscriptions.push(editCommand, hoverProvider, completionProvider);
}

export function deactivate() {}
