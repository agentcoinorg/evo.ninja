export function trimText(text: string | undefined, maxLength: number): string {
  if (!text) {
    return "Undefined";
  }

  return text.length > 200 
    ? text.substring(0, 200) + "..." 
    : text;
}