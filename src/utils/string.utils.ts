export function sanitizeFilename(name: string, maxLength = 200): string {
  return name
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, maxLength);
}

export function createFilenameFromTitle(title: string): string {
  const sanitized = sanitizeFilename(title);
  return sanitized || "Untitled Paper";
}

export function escapeMarkdown(text: string): string {
  return text.replace(/[\\`*_{}[\]()#+\-.!]/g, "\\$&");
}

export function createWikilinkTitle(title: string): string {
  return title.replace(/[[\]|#^]/g, "-").trim();
}
