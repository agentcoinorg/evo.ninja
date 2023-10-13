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

function addColumnToCSVRows(rows, column, values) {
  if (values.length + 1 !== rows.length) {
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
