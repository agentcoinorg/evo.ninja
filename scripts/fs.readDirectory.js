const fs = require('fs');
try {
  const data = fs.readdirSync(path);
  return data;
} catch (error) {
  throw error;
}