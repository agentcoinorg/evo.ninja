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

function joinCSVs(csv1, csv2, columnName) {
  const { rows: rows1, delimiter } = parseCSV(csv1);
  const { rows: rows2 } = parseCSV(csv2);

  // Extract the index of the join column for each CSV
  const joinIndex1 = rows1[0].indexOf(columnName);
  const joinIndex2 = rows2[0].indexOf(columnName);

  if (joinIndex1 === -1 || joinIndex2 === -1) {
    throw new Error(`Join column "${columnName}" not found in one of the CSVs.`);
  }

  // Extract headers
  const headers1 = rows1[0];
  const headers2 = rows2[0];

  // Extract the data rows
  const dataRows1 = rows1.slice(1);
  const dataRows2 = rows2.slice(1);

  // Build a lookup table from CSV2 for easy access using the join column value
  const lookupTable = dataRows2.reduce((acc, row) => {
    acc[row[joinIndex2]] = row;
    return acc;
  }, {});

  // Combine the rows based on the join column
  const combinedDataRows = dataRows1.map(row1 => {
    const matchedRow = lookupTable[row1[joinIndex1]];
    if (!matchedRow) return null; // or handle unmatched rows as needed

    // Merge row1 with the matched row, excluding the join column from CSV2
    return row1.concat(matchedRow.slice(0, joinIndex2).concat(matchedRow.slice(joinIndex2 + 1)));
  }).filter(row => row);  // Filters out any null rows if unmatched rows aren't handled

  // Combine the headers while excluding the join column from CSV2
  const combinedHeaders = headers1.concat(
    headers2.slice(0, joinIndex2),
    headers2.slice(joinIndex2 + 1)
  );

  // Serialize the combined headers and data rows
  const serializedHeaders = serializeCSV([combinedHeaders], delimiter);
  const serializedDataRows = serializeCSV(combinedDataRows, delimiter);

  // Return the concatenated serialized CSV
  return `${serializedHeaders}\n${serializedDataRows}`;
}

const result = joinCSVs(csv1, csv2, joinColumnName);

if (typeof outputFile === "string") {
  await fs.writeFileSync(outputFile, result);
}

return result;
