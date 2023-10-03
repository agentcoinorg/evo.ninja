const fs = require('fs');

const data = fs.readFileSync(inputPath, 'utf8');
const lines = data.split('\n');
const headers = lines[0].split(',');

if (headers.includes(column)) {
  throw new Error('Column already exists');
}

headers.push(column);
lines[0] = headers.join(',');

for (let i = 1; i < lines.length; i++) {
  const row = lines[i].split(',');
  row.push(values[i - 1] || '');
  lines[i] = row.join(',');
}

const output = lines.join('\n');
fs.writeFileSync(outputPath, output, 'utf8');