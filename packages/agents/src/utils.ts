export const extractRequires = (code: string) => {
  // This regex specifically matches the 'require' keyword by using word boundaries (\b)
  // It also accounts for possible whitespaces before or after the quotes.
  const regex = /\brequire\b\s*\(\s*["']([^"']+)["']\s*\)/g;

  let match;
  const libraries = [];

  // Use exec() in a loop to capture all occurrences
  while ((match = regex.exec(code)) !== null) {
    // match[1] contains the captured group with the library name
    libraries.push(match[1]);
  }

  return libraries;
}