const fs = require('fs');

// Read the content of the file
let fileContent = fs.readFileSync(content, 'utf8');

// Append the new line to the content
fileContent += '\n' + line;

// Write the updated content back to the file
fs.writeFileSync(content, fileContent, 'utf8');

return true;