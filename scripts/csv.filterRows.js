function parseCSV(data, delimiter) {
  const rows = data.trim().split('\n');
  return rows.map(row => row.split(delimiter));
}

function serializeCSV(rows, delimiter) {
  return rows.map(row => row.join(delimiter)).join("\n");
}

const rows = parseCSV(csvData, delimiter);

const filteredRows = rows.filter(row =>
  row[columnIndex].includes(searchString)
);

return serializeCSV(filteredRows, delimiter);
