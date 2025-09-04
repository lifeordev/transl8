import * as vscode from "vscode";

/**
 * Provides Quick Fix actions for 'no-translation' diagnostics.
 */
export class Transl8QuickFixProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
  ];

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const actions: vscode.CodeAction[] = [];

    // Find diagnostics that this provider can fix
    const relevantDiagnostics = context.diagnostics.filter(
      (diagnostic) => diagnostic.code === "no-translation"
    );

    relevantDiagnostics.forEach((diagnostic) => {
      actions.push(this.createAddTranslationCommand(document, diagnostic));
    });

    return actions;
  }

  private createAddTranslationCommand(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction {
    // The text within the diagnostic's range is our translation key
    const key = document.getText(diagnostic.range);

    // Create the CodeAction that will be shown as the Quick Fix
    const action = new vscode.CodeAction(
      "Add Translation...",
      vscode.CodeActionKind.QuickFix
    );

    // Set the command that will be executed when the user clicks the Quick Fix
    action.command = {
      command: "lifeordev.transl8.editTranslation", // Your command ID
      title: "Add a new translation",
      tooltip: "This will open an input to add a new translation for this key.",
      arguments: [key, document.uri.toString()], // Pass the key and URI
    };

    // Mark this action as the preferred one for this diagnostic
    action.isPreferred = true;

    return action;
  }
}
