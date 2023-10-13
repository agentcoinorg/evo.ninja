function parseCSV(data, delimiter) {
  const supportedDelimiters = [",", ";", "\t", "|", ":"];

  if (!supportedDelimiters.includes(delimiter)) {
    throw new Error(`Delimiter "${delimiter}" not supported. Supported delimiters: ${
      supportedDelimiters.map((x) => `"${x}"`).join(", ")
    }`);
  }

  const rows = data.trim().split('\n');
  return rows.map(row => row.split(delimiter));
}

const rows = parseCSV(csvData, delimiter);
let sum = 0;

// Start from 1 if there's a header row
for (let i = hasHeader ? 1 : 0; i < rows.length; i++) {
  const value = parseFloat(rows[i][columnIndex]);
  if (!isNaN(value)) {
    sum += value;
  }
}

return sum;
