/**
 * Updates a value in a nested object based on a dot-notation path.
 * This function mutates the object in place.
 *
 * @param obj The object to update.
 * @param keyPath The dot-notation path (e.g., "parent.child.key").
 * @param value The new value to set at the specified path.
 */
export function updateValueInObject(
  obj: Record<string, any>,
  keyPath: string,
  value: [string, string?]
) {
  const keys = keyPath.split(".");
  let current = obj;

  // Traverse the path, creating nested objects if they don't exist
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (typeof current[key] !== "object" || current[key] === null) {
      current[key] = {};
    }
    current = current[key];
  }

  // Set the value at the final key in the path
  current[keys[keys.length - 1]] = value;
}
