import * as vscode from "vscode";
import * as fs from "fs";

/**
 * The in-memory store for all translation key/value pairs.
 * This is exported so other modules can read from it.
 */
export const translations: Map<string, [string, string?]> = new Map();

/**
 * Recursively flattens a nested object into a Map with dot-notation keys.
 * @param obj The object to flatten.
 * @param prefix The prefix to use for the keys.
 * @returns A flat Map of translation keys to their values.
 */
function flattenObjectToMap(
  obj: Record<string, any>,
  prefix = ""
): Map<string, [string, string?]> {
  const map = new Map<string, [string, string?]>();

  for (const key in obj) {
    // Ensure the key is an own property of the object
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newPrefix = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];

      if (
        typeof value === "object" &&
        !Array.isArray(value) &&
        value !== null
      ) {
        // If the value is another object, recurse deeper
        const nestedMap = flattenObjectToMap(value, newPrefix);
        nestedMap.forEach((val, k) => map.set(k, val));
      } else if (Array.isArray(value)) {
        // This is a valid translation entry
        map.set(newPrefix, value as [string, string?]);
      }
    }
  }
  return map;
}

/**
 * Reads the specified translation file, parses it, and populates the global translations map.
 * @param filePath The absolute path to the JSON translation file.
 */
export function loadTranslations(filePath: string | undefined) {
  // 1. Clear previous translations to ensure a fresh state
  translations.clear();

  // 2. Guard against missing file paths or non-existent files
  if (!filePath || !fs.existsSync(filePath)) {
    return;
  }

  // 3. Read and parse the file
  try {
    const fileContents = fs.readFileSync(filePath, "utf8");
    const json = JSON.parse(fileContents);
    const flattenedMap = flattenObjectToMap(json);

    // 4. Populate the exported map with the new data
    flattenedMap.forEach((value, key) => {
      translations.set(key, value);
    });
    console.log(
      `Transl8: Successfully loaded ${translations.size} translations.`
    );
  } catch (error) {
    if (error instanceof Error) {
      vscode.window.showErrorMessage(
        `Transl8: Failed to load translation file. Error: ${error.message}`
      );
    }
  }
}
