const fs = require('fs');

const csvData = fs.readFileSync(inputPath, 'utf8');
const lines = csvData.split('\n');
const headers = lines[0].split(',');

const jsonOutput = lines.slice(1).map(line => {
  const values = line.split(',');
  return headers.reduce((acc, header, index) => {
    acc[header] = values[index];
    return acc;
  }, {});
});

return JSON.stringify(jsonOutput);