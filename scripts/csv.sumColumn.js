const fs = require('fs');
const path = require('path');

function detectDelimiter(row) {
  const supportedDelimiters = [",", ";", "\t", "|", ":"];

  for (let delimiter of supportedDelimiters) {
      if (row.includes(delimiter)) {
          return delimiter;
      }
  }

  return supportedDelimiters[0];
}

function parseCSV(data) {
  if (data.indexOf("\n") === -1 && path.extname(data) === ".csv") {
    data = fs.readFileSync(data, "utf-8");
  }
  const rows = data.trim().split('\n');
  const delimiter = detectDelimiter(rows[0]);
  return { rows: rows.map(row => row.split(delimiter)), delimiter };
}

const { rows } = parseCSV(csv);
let sum = 0;

// Start from 1 if there's a header row
for (let i = withHeader ? 1 : 0; i < rows.length; i++) {
  const value = parseFloat(rows[i][columnIndex]);
  if (!isNaN(value)) {
    sum += value;
  }
}

return sum;
