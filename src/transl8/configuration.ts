import * as vscode from "vscode";
import * as path from "path";

/**
 * Represents the resolved configuration for a specific resource.
 */
export interface Transl8Config {
  absoluteSourceCodePath: string | undefined;
  absoluteTranslationPath: string | undefined;
  targetFunctionNames: string[];
  workspaceFolder: vscode.WorkspaceFolder;
}

/**
 * Gets the workspace configuration scoped to a specific resource URI.
 * @param resourceUri The URI of the document to get configuration for.
 * @returns The resolved configuration object or undefined if not applicable.
 */
export function getConfigForUri(
  resourceUri: vscode.Uri
): Transl8Config | undefined {
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(resourceUri);
  if (!workspaceFolder) {
    return undefined; // Not in a workspace folder
  }

  const configuration = vscode.workspace.getConfiguration(
    "lifeordev.transl8",
    resourceUri
  );

  const translationFilePath = configuration.get<string>("translationFilePath");
  if (!translationFilePath) {
    return undefined; // Extension is not configured for this folder
  }

  const absoluteTranslationPath = path.isAbsolute(translationFilePath)
    ? translationFilePath
    : path.join(workspaceFolder.uri.fsPath, translationFilePath);

  const sourceCodePath = configuration.get<string>("sourceCodePath");
  const absoluteSourceCodePath =
    sourceCodePath && path.resolve(workspaceFolder.uri.fsPath, sourceCodePath);

  return {
    absoluteTranslationPath,
    absoluteSourceCodePath: absoluteSourceCodePath || undefined,
    targetFunctionNames: configuration.get<string[]>("functionNames") || [],
    workspaceFolder,
  };
}
