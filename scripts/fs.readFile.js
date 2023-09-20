const fs = require('fs').promises;

try {
  const data = await fs.readFile(path, encoding);
  return data;
} catch (error) {
  console.error(`Error reading file at ${path}:`, error);
}