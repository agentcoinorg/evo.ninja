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

function serializeCSV(rows, delimiter) {
  return rows.map(row => row.join(delimiter)).join("\n");
}

function sortCSVByColumn(rows, columnIndex) {
  // Extract the header from rows
  const header = rows[0];

  // Sort the rows based on the values in the specified column
  // Note: We start sorting from index 1 to skip the header row
  const sortedDataRows = rows.slice(1).sort((a, b) => {
    // Assuming you want to sort as strings, if you need to sort as numbers, convert them first
    const valueA = a[columnIndex].trim();
    const valueB = b[columnIndex].trim();

    if (valueA < valueB) return -1;
    if (valueA > valueB) return 1;
    return 0;
  });

  // Add the header row back to the top
  return [header].concat(sortedDataRows);
}

const { rows, delimiter } = parseCSV(csvData);

const sortedRows = sortCSVByColumn(rows, columnIndex);

return serializeCSV(sortedRows, delimiter);
