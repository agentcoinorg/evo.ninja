export function trimText(text: string | undefined, maxLength: number): string {
  if (!text) {
    return "Undefined";
  }

  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}
