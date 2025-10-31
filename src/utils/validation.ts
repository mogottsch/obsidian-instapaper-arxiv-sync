export function isEmptyString(value: string): boolean {
  return value.trim().length === 0;
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidArxivId(id: string): boolean {
  const newFormat = /^\d{4}\.\d{4,5}(v\d+)?$/;
  const oldFormat = /^[a-z-]+\/\d{7}$/;
  return newFormat.test(id) || oldFormat.test(id);
}
