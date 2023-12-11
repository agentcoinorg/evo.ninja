const fs = require('fs');
const path = require('path');

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
  if (data.indexOf("\n") === -1 && path.extname(data) === ".csv") {
    data = fs.readFileSync(data, "utf-8");
  }
  const rows = data.trim().split('\n');
  const delimiter = detectDelimiter(rows[0]);
  return { rows: rows.map(row => row.split(delimiter)), delimiter };
}

function serializeCSV(rows, delimiter) {
  return rows.map(row => row.join(delimiter)).join("\n");
}

const { rows, delimiter } = parseCSV(csv);

// Separate header from the rest of the rows
let resultRows = [];

const [header, ...otherRows] = rows;

const columnIndex = header.indexOf(columnName);

const filteredRows = otherRows.filter(row =>
  row[columnIndex].includes(filterValue)
);

// Add the header back to the top
resultRows = [header].concat(filteredRows);

const result = serializeCSV(resultRows, delimiter);

if (typeof outputFile === "string") {
  await writeFileSync(outputFile, result);
}

return result;
