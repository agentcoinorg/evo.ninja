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

const { rows, delimiter } = parseCSV(csvData);

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
