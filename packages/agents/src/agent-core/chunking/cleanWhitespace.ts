export const cleanWhitespace = (text: string) => text
  .split("\n")
  .map(x => x.replace(/\s+/g, ' ').trim())
  .filter(x => x.length > 0)
  .join("\n");
