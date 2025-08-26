import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { updateValueInObject } from "./utils";

/**
 * Registers the command to edit a translation.
 * @param translations A map holding the current translation key/value pairs.
 */
export function registerEditTranslationCommand(
  translations: Map<string, [string, string?]>
): vscode.Disposable {
  return vscode.commands.registerCommand(
    "lifeordev.transl8.editTranslation",
    async (key: string) => {
      const configuration =
        vscode.workspace.getConfiguration("lifeordev.transl8");
      const translationFilePath = configuration.get<string>(
        "translationFilePath"
      );

      // 1. Pre-computation checks
      if (!translationFilePath || !vscode.workspace.workspaceFolders) {
        vscode.window.showErrorMessage(
          "Transl8: Translation file path not configured."
        );
        return;
      }

      const absoluteTranslationPath = path.isAbsolute(translationFilePath)
        ? translationFilePath
        : path.join(
            vscode.workspace.workspaceFolders[0].uri.fsPath,
            translationFilePath
          );

      // Check if key is a substring prefix of another key
      for (const existingKey of translations.keys()) {
        if (existingKey !== key && existingKey.startsWith(key + ".")) {
          vscode.window.showWarningMessage(
            `Cannot edit "${key}" because a more specific key "${existingKey}" exists.`
          );
          return;
        }
      }

      // 2. Get user input
      const currentValue = translations.get(key) || [""];

      const newValue = await vscode.window.showInputBox({
        prompt: `Edit translation for "${key}"`,
        value: currentValue[0],
        placeHolder: "Enter the new translation",
      });

      // User cancelled the input box
      if (newValue === undefined) {
        return;
      }

      let newCtx = await vscode.window.showInputBox({
        prompt: "Edit context/comment (optional)",
        placeHolder: "Enter context or comment",
        value: currentValue[1] || "",
      });

      if (newCtx === "") {
        newCtx = undefined; // Treat empty string as no context
      }

      // 3. Update the file if changes were made
      if (newValue !== currentValue[0] || newCtx !== currentValue[1]) {
        try {
          const fileContents = fs.readFileSync(absoluteTranslationPath, "utf8");
          const jsonObject = JSON.parse(fileContents);

          const finalValue: [string, string?] = [newValue, newCtx];
          updateValueInObject(jsonObject, key, finalValue);

          const updatedFileContents = JSON.stringify(jsonObject, null, 2);
          fs.writeFileSync(
            absoluteTranslationPath,
            updatedFileContents,
            "utf8"
          );
        } catch (error) {
          if (error instanceof Error) {
            vscode.window.showErrorMessage(
              `Failed to update translation file: ${error.message}`
            );
          }
        }
      }
    }
  );
}
