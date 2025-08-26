import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

let translations: Map<string, [string, string?]> = new Map();
let absoluteSourceCodePath: string | undefined;
let fileWatcher: vscode.FileSystemWatcher | undefined;
let targetFunctionNames: string[] = [];

export function activate(context: vscode.ExtensionContext) {
  reloadConfiguration();

  const editCommand = vscode.commands.registerCommand(
    "lifeordev.transl8.editTranslation",
    async (key: string) => {
      const configuration =
        vscode.workspace.getConfiguration("lifeordev.transl8");
      const translationFilePath = configuration.get<string>(
        "translationFilePath"
      );

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

      const currentValue = translations.get(key) || "";

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
        placeHolder: "enter context or comment",
        value: currentValue[1] || "",
      });
      if (newCtx === "") {
        newCtx = undefined;
      }

      if (newValue !== currentValue || newCtx !== currentValue[1]) {
        try {
          const fileContents = fs.readFileSync(absoluteTranslationPath, "utf8");
          const jsonObject = JSON.parse(fileContents);

          if (newCtx === undefined) {
            updateValueInObject(jsonObject, key, [newValue]);
          } else {
            updateValueInObject(jsonObject, key, [newValue, newCtx]);
          }

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

  const completionProvider = vscode.languages.registerCompletionItemProvider(
    ["javascript", "typescript", "vue"],
    {
      provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
      ) {
        if (
          !absoluteSourceCodePath ||
          !document.uri.fsPath.startsWith(absoluteSourceCodePath)
        ) {
          return undefined;
        }

        const linePrefix = document
          .lineAt(position.line)
          .text.substring(0, position.character);

        const functionNamesRegexPart = targetFunctionNames.join("|");
        const regex = new RegExp(
          `(?:${functionNamesRegexPart})\\s*\\(\\s*['"]$`
        );

        if (!regex.test(linePrefix)) {
          return undefined;
        }

        const translationKeys = Array.from(translations.keys());

        return translationKeys.map((key) => {
          const item = new vscode.CompletionItem(
            key,
            vscode.CompletionItemKind.Value
          );
          item.detail = `Translation Key`;
          item.documentation = new vscode.MarkdownString(
            `**Translation:** \`${translations.get(key)}\``
          );
          return item;
        });
      },
    },
    "'",
    '"'
  );

  const hoverProvider = vscode.languages.registerHoverProvider(
    ["javascript", "typescript", "vue"],
    {
      provideHover(document: vscode.TextDocument, position: vscode.Position) {
        if (targetFunctionNames.length === 0) {
          return undefined;
        }

        const functionNamesRegexPart = targetFunctionNames.join("|");
        const keyRegex = new RegExp(
          `(?:${functionNamesRegexPart})\\s*\\(\\s*['"]([^'"]+)['"]\\s*\\)`,
          "g"
        );

        const lineText = document.lineAt(position.line).text;

        let match;
        while ((match = keyRegex.exec(lineText)) !== null) {
          const key = match[1];
          const start = match.index + match[0].indexOf(key);
          const end = start + key.length;

          if (position.character >= start && position.character <= end) {
            const translation = translations.get(key);

            const markdownString = new vscode.MarkdownString();
            markdownString.isTrusted = true;

            const args = [key];
            const encodedArgs = encodeURIComponent(JSON.stringify(args));
            const editCommandUri = vscode.Uri.parse(
              `command:lifeordev.transl8.editTranslation?${encodedArgs}`
            );
            if (translation) {
              markdownString.appendMarkdown(
                `**Transl8** &nbsp; [✏️ Edit](${editCommandUri})\n\n`
              );
              markdownString.appendMarkdown(`*Key:* \`${key}\`\n\n`);
              markdownString.appendCodeblock(translation[0], "plaintext");
              markdownString.appendMarkdown(
                `\n\n*Context:* ${translation[1] ?? "_No comment provided._"}`
              );
            } else {
              markdownString.appendMarkdown(
                `**Transl8** &nbsp; [✏️ Add Translation](${editCommandUri})\n\n`
              );
              markdownString.appendMarkdown(
                `No translation found for key: \`${key}\``
              );
            }
            return new vscode.Hover(markdownString);
          }
        }

        return undefined;
      },
    }
  );

  context.subscriptions.push(completionProvider, hoverProvider, editCommand);

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("lifeordev.transl8")) {
        reloadConfiguration();
      }
    })
  );
}

function reloadConfiguration() {
  if (fileWatcher) {
    fileWatcher.dispose();
  }

  const configuration = vscode.workspace.getConfiguration("lifeordev.transl8");
  const sourceCodePath = configuration.get<string>("sourceCodePath");
  if (sourceCodePath && vscode.workspace.workspaceFolders) {
    absoluteSourceCodePath = path.resolve(
      vscode.workspace.workspaceFolders[0].uri.fsPath,
      sourceCodePath
    );
  } else {
    absoluteSourceCodePath = undefined;
  }

  const translationFilePath = configuration.get<string>("translationFilePath");
  if (!translationFilePath) {
    vscode.window.showWarningMessage(
      "Transl8: Translation file path is not configured."
    );
    return;
  }

  let absoluteTranslationPath = translationFilePath;
  if (
    !path.isAbsolute(absoluteTranslationPath) &&
    vscode.workspace.workspaceFolders
  ) {
    absoluteTranslationPath = path.join(
      vscode.workspace.workspaceFolders[0].uri.fsPath,
      absoluteTranslationPath
    );
  }

  targetFunctionNames = configuration.get<string[]>("functionNames") || [];
  if (targetFunctionNames.length === 0) {
    vscode.window.showWarningMessage("Transl8: No function names configured.");
  }

  loadTranslationsFromFile(absoluteTranslationPath);

  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (workspaceFolder && fs.existsSync(absoluteTranslationPath)) {
    const relativePath = path.relative(
      workspaceFolder.uri.fsPath,
      absoluteTranslationPath
    );

    fileWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(workspaceFolder, relativePath)
    );

    fileWatcher.onDidChange(() => {
      console.log(
        `Transl8: Detected change in ${relativePath}. Reloading translations.`
      );
      loadTranslationsFromFile(absoluteTranslationPath);
    });

    fileWatcher.onDidCreate(() => {
      console.log(
        `Transl8: Detected creation of ${relativePath}. Reloading translations.`
      );
      loadTranslationsFromFile(absoluteTranslationPath);
    });

    fileWatcher.onDidDelete(() => {
      console.log(
        `Transl8: Detected deletion of ${relativePath}. Clearing translations.`
      );
      translations.clear();
      vscode.window.showWarningMessage(
        "Transl8: Translation file was deleted."
      );
    });
  }
}

function flattenObjectToMap(
  obj: Record<string, any>,
  prefix = ""
): Map<string, [string, string?]> {
  const map = new Map<string, [string, string?]>();

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newPrefix = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];

      if (
        typeof value === "object" &&
        !Array.isArray(value) &&
        value !== null
      ) {
        const nestedMap = flattenObjectToMap(value, newPrefix);
        nestedMap.forEach((val, k) => map.set(k, val));
      } else {
        map.set(newPrefix, value);
      }
    }
  }
  return map;
}

function loadTranslationsFromFile(filePath: string) {
  try {
    const fileContents = fs.readFileSync(filePath, "utf8");
    const json = JSON.parse(fileContents);
    translations = flattenObjectToMap(json);
  } catch (error) {
    if (error instanceof Error) {
      vscode.window.showErrorMessage(
        `Transl8: Failed to load translation file. Error: ${error.message}`
      );
      translations.clear();
    }
  }
}

export function deactivate() {
  if (fileWatcher) {
    fileWatcher.dispose();
  }
}

function updateValueInObject(
  obj: Record<string, any>,
  path: string,
  value: [string, string?]
) {
  const keys = path.split(".");
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (typeof current[key] !== "object" || current[key] === null) {
      current[key] = {};
    }
    current = current[key];
  }
  current[keys[keys.length - 1]] = value;
}
