function parseCSV(data, delimiter) {
  const rows = data.trim().split('\n');
  return rows.map(row => row.split(delimiter));
}
function serializeCSV(rows, delimiter) {
  return rows.map(row => row.join(delimiter)).join("\n");
}

const parsedData = parseCSV(csvData, delimiter);
const rows = parsedData.filter(row =>
  row[columnIndex].includes(searchString)
);

return serializeCSV(rows, delimiter);
