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

const rows = parseCSV(csvData, delimiter);

const reorderedRows = orderColumnsAlphabetically(rows);

return serializeCSV(reorderedRows, delimiter);
