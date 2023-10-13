function detectDelimiter(row) {
  const supportedDelimiters = [",", ";", "\t", "|", ":"];

  for (let delimiter of supportedDelimiters) {
      if (row.includes(delimiter)) {
          return delimiter;
      }
  }

  throw new Error(`No known delimiter found. Supported delimiters: ${
    supportedDelimiters.map((x) => `"${x}"`).join(", ")
  }`);
}

function parseCSV(data) {
  const rows = data.trim().split('\n');
  const delimiter = detectDelimiter(rows[0]);
  return { rows: rows.map(row => row.split(delimiter)), delimiter };
}

const { rows } = parseCSV(csvData);
let sum = 0;

// Start from 1 if there's a header row
for (let i = hasHeader ? 1 : 0; i < rows.length; i++) {
  const value = parseFloat(rows[i][columnIndex]);
  if (!isNaN(value)) {
    sum += value;
  }
}

return sum;
