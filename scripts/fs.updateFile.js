const fs = require("fs");
try {
  if (!fs.existsSync(path)) {
    throw new Error(`File does not exist at ${path}`);
  }
  const originalContent = fs.readFileSync(path, "utf-8");
  const lines = originalContent.split("\n");

  const start = startLn < 0 ? 0 : startLn;

  const end = endLn === undefined
    ? lines.length
    // allow end to exceed original content length
    : endLn > lines.length
      ? lines.length
      // nothing is extracted if end <= start
      : endLn < start
        ? start
        : endLn;

  // allow start to exceed original content length
  while (start > lines.length) lines.push("");

  const keepFromStart = lines.slice(0, start);
  const keepFromEnd = lines.slice(end);
  const newContent = [...keepFromStart, content, ...keepFromEnd].join("\n");

  fs.writeFileSync(path, newContent, "utf-8");
} catch (error) {
  throw new Error(`Failed to write file: ${error.message}`);
}