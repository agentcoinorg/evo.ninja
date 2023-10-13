function parseCSV(data, delimiter) {
  const rows = data.trim().split('\n');
  return rows.map(row => row.split(delimiter));
}

function serializeCSV(rows, delimiter) {
  return rows.map(row => row.join(delimiter)).join("\n");
}

function addColumnToCSVRows(rows, column, values) {
  // Subtract 1 to exclude header row from count
  if (values.length !== rows.length - 1) {
    throw new Error('Mismatch in number of rows and provided values');
  }

  // Add the column to the header row
  rows[0].push(column);

  // Add the values to the subsequent rows
  for (let i = 1; i < rows.length; i++) {
    rows[i].push(values[i - 1]);
  }

  return rows;
}

const rows = parseCSV(csvData, delimiter);

const updatedRows = addColumnToCSVRows(rows, column, values);

return serializeCSV(updatedRows, delimiter);
