function parseCSV(data, delimiter) {
  const rows = data.trim().split('\n');
  return rows.map(row => row.split(delimiter));
}

const parsedData = parseCSV(csvData, delimiter);
return parsedData.filter(row =>
  row[columnIndex].includes(searchString)
);
