import * as vscode from "vscode";
import * as fs from "fs";
import { updateValueInObject } from "./utils";
import { getConfigForUri } from "./configuration";
import { loadTranslations } from "./translationManager";

export function registerEditTranslationCommand(): vscode.Disposable {
  return vscode.commands.registerCommand(
    "lifeordev.transl8.editTranslation",
    // The command now receives the key and the URI of the document it was triggered from.
    async (key: string, resourceUriString: string) => {
      const resourceUri = vscode.Uri.parse(resourceUriString);
      const config = getConfigForUri(resourceUri);

      if (!config || !config.absoluteTranslationPath) {
        vscode.window.showErrorMessage(
          "Transl8: Could not find configuration for the active file."
        );
        return;
      }
      const absoluteTranslationPath = config.absoluteTranslationPath;
      const translations = loadTranslations(absoluteTranslationPath);

      // (The rest of the logic is largely the same, but uses the resolved `absoluteTranslationPath`)
      for (const existingKey of translations.keys()) {
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
          // Ensure the file exists before trying to read it, create if not.
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
