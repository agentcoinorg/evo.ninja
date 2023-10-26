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

function getJoinableColumns(csv1, csv2) {
  const { rows: rows1 } = parseCSV(csv1);
  const { rows: rows2 } = parseCSV(csv2);

  const header1 = rows1[0];
  const header2 = rows2[0];

  const set1 = new Set(header1);
  return header2.filter(item => set1.has(item));
}

return getJoinableColumns(csv1, csv2);
