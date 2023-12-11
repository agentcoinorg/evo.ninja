const fs = require('fs');
try {
  fs.writeFileSync(path, data, encoding);
} catch (error) {
  throw new Error(`Failed to write file: ${error.message}`);
}