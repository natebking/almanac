const PLACEHOLDER_RE = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

export function extractPlaceholders(input: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const match of input.matchAll(PLACEHOLDER_RE)) {
    const key = match[1];
    if (!seen.has(key)) {
      seen.add(key);
      result.push(key);
    }
  }

  return result;
}

export function replacePlaceholders(
  input: string,
  values: Record<string, string>,
): string {
  return input.replace(PLACEHOLDER_RE, (full, key: string) => {
    const value = values[key];
    return value === undefined ? full : value;
  });
}
