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

export function validDate(value: string) {
  // Check if the string matches YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  if (month < 1 || month > 12) {
    return false;
  }

  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function getGraphemeLength(str: string) {
  // Use Intl.Segmenter if available (modern browsers)
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter();
    return Array.from(segmenter.segment(str)).length;
  }
  // Fallback: count surrogate pairs as single characters
  return [...str].length;
}