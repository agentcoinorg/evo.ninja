function parseCSV(data, delimiter) {
  const rows = data.trim().split('\n');
  return rows.map(row => row.split(delimiter));
}

function serializeCSV(rows, delimiter) {
  return rows.map(row => row.join(delimiter)).join("\n");
}

const rows = parseCSV(csvData, delimiter);

// Separate header from the rest of the rows
let resultRows = [];

if (withHeader) {
  const [header, ...otherRows] = rows;

  const filteredRows = otherRows.filter(row =>
    row[columnIndex].includes(searchString)
  );

  // Add the header back to the top
  resultRows = [header].concat(filteredRows);
} else {
  resultRows = rows.filter(row =>
    row[columnIndex].includes(searchString)
  );
}

return serializeCSV(resultRows, delimiter);
