import { isValid, parseISO } from 'date-fns';

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
  const parsed = parseISO(value);
  return isValid(parsed);
}

export function validDateTime(value: string) {
  // KNOWN ISSUE: Date.parse does not handle leap seconds (23:59:60)
  const normalizedValue = value.replace(/t/i, 'T').replace(/z/i, 'Z');
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|([+-])(\d{2}):?(\d{2}))$/;
  const match = isoRegex.exec(normalizedValue);
  if (!match) return false;
  // If there's a timezone offset, validate it
  if (match[1]) {
    // match[1] contains the +/- sign
    const hours = parseInt(match[2], 10);
    const minutes = parseInt(match[3], 10);

    // Hours must be 0-23, minutes 0-59
    if (hours > 23 || minutes > 59) {
      return false;
    }
  }

  // Use date-fns to parse and validate the actual date
  const parsed = parseISO(normalizedValue);
  return isValid(parsed);
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
