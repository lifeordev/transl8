import * as vscode from "vscode";
import * as fs from "fs";
import { updateValueInObject } from "./utils";
import { getConfigForUri } from "./configuration";
import { loadTranslations } from "./translationManager";

export function registerEditTranslationCommand(): vscode.Disposable {
  return vscode.commands.registerCommand(
    "lifeordev.transl8.editTranslation",
    async (key?: string, resourceUriString?: string) => {
      let resourceUri: vscode.Uri | undefined;

      if (resourceUriString) {
        resourceUri = vscode.Uri.parse(resourceUriString);
      } else if (vscode.window.activeTextEditor) {
        resourceUri = vscode.window.activeTextEditor.document.uri;
      }

      if (!resourceUri) {
        vscode.window.showErrorMessage(
          "Transl8: Could not determine the file context. Please open a file."
        );
        return;
      }

      const config = getConfigForUri(resourceUri);
      if (!config || !config.absoluteTranslationPath) {
        vscode.window.showErrorMessage(
          "Transl8: Could not find configuration for the active file."
        );
        return;
      }

      // 2. DETERMINE THE TRANSLATION KEY
      // If a key wasn't passed in (e.g., from the Command Palette), prompt the user for it.
      if (!key) {
        key = await vscode.window.showInputBox({
          prompt: "Enter the translation key to edit or create",
          placeHolder: "example.key.here",
        });
      }

      // If the user didn't provide a key (e.g., they pressed Escape), stop here.
      if (!key) {
        return;
      }

      // --- From this point on, the rest of your logic can proceed safely ---
      const absoluteTranslationPath = config.absoluteTranslationPath;
      const translations = loadTranslations(absoluteTranslationPath);

      for (const existingKey of translations.keys()) {
        // Use the final, determined key
        if (existingKey !== key && existingKey.startsWith(key + ".")) {
          vscode.window.showWarningMessage(
            `Cannot edit "${key}" because a more specific key "${existingKey}" exists.`
          );
          return;
        }
      }

      const currentValue = translations.get(key) || [""];
      const newValue = await vscode.window.showInputBox({
        prompt: `Edit translation for "${key}"`,
        value: currentValue[0],
        placeHolder: "Enter the new translation",
      });

      // ... (the rest of your function remains the same) ...
      if (newValue === undefined) {
        return;
      }

      let newCtx = await vscode.window.showInputBox({
        prompt: "Edit context/comment (optional)",
        placeHolder: "Enter context or comment",
        value: currentValue[1] || "",
      });

      if (newCtx === "") {
        newCtx = undefined;
      }

      if (newValue !== currentValue[0] || newCtx !== currentValue[1]) {
        try {
          let jsonObject = {};
          if (fs.existsSync(absoluteTranslationPath)) {
            const fileContents = fs.readFileSync(
              absoluteTranslationPath,
              "utf8"
            );
            jsonObject = JSON.parse(fileContents);
          }

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
