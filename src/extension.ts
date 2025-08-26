import * as vscode from "vscode";
import { registerEditTranslationCommand } from "./transl8/commands";
import { registerHoverProvider } from "./transl8/hoverProvider";
import { registerCompletionProvider } from "./transl8/completionProvider";
import { initializeConfiguration, extConfig } from "./transl8/configuration";
import { loadTranslations, translations } from "./transl8/translationManager";

// This function is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  console.log("Transl8 extension is now active!");

  // 1. Initialize configuration management.
  // This sets up listeners for settings changes and for the translation file itself.
  // The callback provided is executed whenever a change is detected.
  const configDisposable = initializeConfiguration(() =>
    loadTranslations(extConfig.absoluteTranslationPath)
  );

  // 2. Register all features and commands
  const editCommand = registerEditTranslationCommand(translations);

  // Note: The providers below will need a small update to import their dependencies
  // directly, making them self-sufficient. See the note after this code block.
  const hoverProvider = registerHoverProvider(
    translations,
    extConfig.targetFunctionNames
  );

  const completionProvider = registerCompletionProvider(
    translations,
    extConfig.targetFunctionNames,
    extConfig.absoluteSourceCodePath
  );

  // 3. Add all disposables to the extension's subscriptions.
  // This ensures they are cleaned up automatically when the extension is deactivated.
  context.subscriptions.push(
    configDisposable,
    editCommand,
    hoverProvider,
    completionProvider
  );
}

// This function is called when your extension is deactivated
export function deactivate() {}
