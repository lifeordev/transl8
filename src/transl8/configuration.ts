import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

// A disposable watcher instance that needs to be managed across reloads.
let fileWatcher: vscode.FileSystemWatcher | undefined;

/**
 * An object to hold and export the current, resolved configuration values.
 */
export const extConfig = {
  absoluteSourceCodePath: undefined as string | undefined,
  absoluteTranslationPath: undefined as string | undefined,
  targetFunctionNames: [] as string[],
};

/**
 * Reloads the extension's configuration, updates the exported `extConfig` object,
 * and re-initializes the file watcher on the translation file.
 * @param onTranslationFileChanged A callback function to execute when the translation file is changed, created, or deleted.
 */
function reloadConfiguration(onTranslationFileChanged: () => void) {
  // 1. Dispose of the old file watcher if it exists to prevent duplicates
  if (fileWatcher) {
    fileWatcher.dispose();
  }

  const configuration = vscode.workspace.getConfiguration("lifeordev.transl8");
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

  // 2. Resolve the source code path
  const sourceCodePath = configuration.get<string>("sourceCodePath");
  if (sourceCodePath && workspaceFolder) {
    extConfig.absoluteSourceCodePath = path.resolve(
      workspaceFolder.uri.fsPath,
      sourceCodePath
    );
  } else {
    extConfig.absoluteSourceCodePath = undefined;
  }

  // 3. Resolve the translation file path
  const translationFilePath = configuration.get<string>("translationFilePath");
  if (!translationFilePath) {
    vscode.window.showWarningMessage(
      "Transl8: Translation file path is not configured."
    );
    extConfig.absoluteTranslationPath = undefined;
  } else if (workspaceFolder) {
    extConfig.absoluteTranslationPath = path.isAbsolute(translationFilePath)
      ? translationFilePath
      : path.join(workspaceFolder.uri.fsPath, translationFilePath);
  }

  // 4. Get the target function names
  extConfig.targetFunctionNames =
    configuration.get<string[]>("functionNames") || [];
  if (extConfig.targetFunctionNames.length === 0) {
    vscode.window.showWarningMessage("Transl8: No function names configured.");
  }

  // 5. Trigger an immediate refresh of translations based on the new config
  onTranslationFileChanged();

  // 6. Set up a new file watcher
  if (
    workspaceFolder &&
    extConfig.absoluteTranslationPath &&
    fs.existsSync(extConfig.absoluteTranslationPath)
  ) {
    const relativePath = path.relative(
      workspaceFolder.uri.fsPath,
      extConfig.absoluteTranslationPath
    );

    fileWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(workspaceFolder, relativePath)
    );

    const watcherCallback = (
      uri: vscode.Uri,
      type: "change" | "create" | "delete"
    ) => {
      console.log(
        `Transl8: Detected ${type} in ${relativePath}. Reloading translations.`
      );
      onTranslationFileChanged();
      if (type === "delete") {
        vscode.window.showWarningMessage(
          "Transl8: Translation file was deleted."
        );
      }
    };

    fileWatcher.onDidChange((uri) => watcherCallback(uri, "change"));
    fileWatcher.onDidCreate((uri) => watcherCallback(uri, "create"));
    fileWatcher.onDidDelete((uri) => watcherCallback(uri, "delete"));
  }
}

/**
 * Initializes the configuration management and sets up listeners for changes.
 * @param onTranslationFileChanged A callback to run when config changes or the translation file itself changes.
 * @returns A disposable that tears down listeners when the extension is deactivated.
 */
export function initializeConfiguration(
  onTranslationFileChanged: () => void
): vscode.Disposable {
  // Load initial configuration
  reloadConfiguration(onTranslationFileChanged);

  // Set up a listener for changes to the VS Code settings
  const onDidChangeConfiguration = vscode.workspace.onDidChangeConfiguration(
    (e) => {
      if (e.affectsConfiguration("lifeordev.transl8")) {
        console.log("Transl8: Configuration changed. Reloading.");
        reloadConfiguration(onTranslationFileChanged);
      }
    }
  );

  // Return a disposable that cleans up the listeners
  return {
    dispose: () => {
      onDidChangeConfiguration.dispose();
      fileWatcher?.dispose();
    },
  };
}
