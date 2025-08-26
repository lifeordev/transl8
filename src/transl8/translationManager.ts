import * as vscode from "vscode";
import * as fs from "fs";

// Cache to store translations and file modification times to avoid unnecessary file reads.
const translationCache = new Map<
  string,
  { mtime: number; translations: Map<string, [string, string?]> }
>();

/**
 * Recursively flattens a nested object into a Map with dot-notation keys.
 */
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
      } else if (Array.isArray(value)) {
        map.set(newPrefix, value as [string, string?]);
      }
    }
  }
  return map;
}

/**
 * Reads a translation file and returns a map of its contents.
 * Uses a cache to avoid re-reading unchanged files.
 * @param filePath The absolute path to the JSON translation file.
 * @returns A Map of translation keys to values, or an empty map if loading fails.
 */
export function loadTranslations(
  filePath: string | undefined
): Map<string, [string, string?]> {
  if (!filePath || !fs.existsSync(filePath)) {
    return new Map();
  }

  try {
    const stats = fs.statSync(filePath);
    const cached = translationCache.get(filePath);

    // If file is cached and modification time hasn't changed, return cached version.
    if (cached && cached.mtime === stats.mtime.getTime()) {
      return cached.translations;
    }

    const fileContents = fs.readFileSync(filePath, "utf8");
    const json = JSON.parse(fileContents);
    const flattenedMap = flattenObjectToMap(json);

    // Update cache
    translationCache.set(filePath, {
      mtime: stats.mtime.getTime(),
      translations: flattenedMap,
    });

    console.log(
      `Transl8: Successfully loaded/reloaded ${flattenedMap.size} translations from ${filePath}.`
    );
    return flattenedMap;
  } catch (error) {
    if (error instanceof Error) {
      vscode.window.showErrorMessage(
        `Transl8: Failed to load ${filePath}. Error: ${error.message}`
      );
    }
    return new Map();
  }
}
