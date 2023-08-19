const fs = require('fs');
try {
  const data = fs.readFileSync(path, encoding);
  return data;
} catch (error) {
  throw error;
}