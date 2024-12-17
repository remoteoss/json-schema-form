export function canonicalize(obj: unknown): string {
  if (typeof obj !== 'object' || obj === null) {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalize).join(',') + ']';
  }
  const sortedKeys = Object.keys(obj).sort();
  const parts = sortedKeys.map(
    (key) => `${JSON.stringify(key)}:${canonicalize((obj as Record<string, unknown>)[key])}`
  );
  return `{${parts.join(',')}}`;
}
