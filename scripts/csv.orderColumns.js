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

function orderColumnsAlphabetically(rows) {
  const header = rows[0];

  // Get an array of indices ordered by the corresponding column's header
  const orderedIndices = header.map((_, index) => index).sort((a, b) => {
    const valueA = header[a].trim().toLowerCase();
    const valueB = header[b].trim().toLowerCase();

    if (valueA < valueB) return -1;
    if (valueA > valueB) return 1;
    return 0;
  });

  // Use the ordered indices to reorder the columns for each row
  const reorderedRows = rows.map(row => orderedIndices.map(index => row[index]));

  return reorderedRows;
}

const { rows, delimiter } = parseCSV(csvData);

const reorderedRows = orderColumnsAlphabetically(rows);

return serializeCSV(reorderedRows, delimiter);
