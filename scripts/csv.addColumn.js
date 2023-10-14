function detectDelimiter(row) {
  const supportedDelimiters = [",", ";", "\t", "|", ":"];

  for (let delimiter of supportedDelimiters) {
      if (row.includes(delimiter)) {
          return delimiter;
      }
  }

  return supportedDelimiters[0];
}

function parseCSV(data) {
  const rows = data.trim().split('\n');
  const delimiter = detectDelimiter(rows[0]);
  return { rows: rows.map(row => row.split(delimiter)), delimiter };
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

const { rows, delimiter } = parseCSV(csvData);

const updatedRows = addColumnToCSVRows(rows, column, values);

return serializeCSV(updatedRows, delimiter);
