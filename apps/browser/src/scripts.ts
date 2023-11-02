import { InMemoryWorkspace, Workspace } from "@evo-ninja/agent-utils";

export function createInBrowserScripts(): InMemoryWorkspace {
  const workspace = new InMemoryWorkspace();

  const availableScripts = [
    onGoalAchieved,
    onGoalFailed,
    agentSpeak,
    csvAddColum,
    csvFilterRows,
    csvJoinableColumns,
    csvJoinByColumn,
    csvOrderColumns,
    csvSortByColumn,
    csvSumColumn,
    readFile,
    writeFile,
    readDirectory,
    webSearch,
    webFuzzySearch
  ];

  availableScripts.forEach((script) => addScript(script, workspace));

  return workspace;
}

function addScript(
  script: { name: string; definition: string; code: string },
  scriptsWorkspace: Workspace
) {
  scriptsWorkspace.writeFileSync(`${script.name}.json`, script.definition);
  scriptsWorkspace.writeFileSync(`${script.name}.js`, script.code);
}

const onGoalAchieved = {
  name: "agent.onGoalAchieved",
  definition: `{
  "name":"agent.onGoalAchieved",
  "description":"Informs the user that the goal has been achieved.",
  "arguments":"None",
  "code":"./agent.onGoalAchieved.js"
}`,
  code: `return __wrap_subinvoke(
  'plugin/agent',
  'onGoalAchieved',
  { }
).value
`,
};

const onGoalFailed = {
  name: "agent.onGoalFailed",
  definition: `{
  "name":"agent.onGoalFailed",
  "description":"Informs the user that the agent could not achieve the goal.",
  "arguments":"None",
  "code":"./agent.onGoalFailed.js"
}`,
  code: `return __wrap_subinvoke(
  'plugin/agent',
  'onGoalFailed',
  { }
).value
`,
};

const agentSpeak = {
  name: "agent.speak",
  definition: `{
    "name":"agent.speak",
    "description":"Informs the user by sending a message.",
    "arguments":"{ message: string }",
    "code":"./agent.speak.js"
}`,
  code: `return __wrap_subinvoke(
  'plugin/agent',
  'speak',
  { message: message }
).value
`,
};

const readFile = {
  name: "fs.readFile",
  definition: JSON.stringify({
    name: "fs.readFile",
    description: "Reads data from a file",
    arguments: "{ path: string, encoding: string }",
    code: "./fs.readFile.js",
  }),
  code: `const fs = require('fs');
try {
  const data = fs.readFileSync(path, encoding);
  return data;
} catch (error) {
  throw error;
}`,
};

const writeFile = {
  name: "fs.writeFile",
  definition: JSON.stringify({
    name: "fs.writeFile",
    description:
      "Writes data to a file, replacing the file if it already exists.",
    arguments: "{ path: string, data: string, encoding: string }",
    code: "./fs.writeFile.js",
  }),
  code: `
  const fs = require('fs');
  try {
    fs.writeFileSync(path, data, encoding);
  } catch (error) {
    throw new Error(\`Failed to write file: \${error.message}\`);
  }`,
};

const csvAddColum = {
  name: "csv.addColumn",
  definition: JSON.stringify({
    name: "csv.addColumn",
    description: "Adds a new column to a CSV",
    arguments:
      "{ csv: string, column: string, values: string[], outputFile: string }",
    code: "./csv.addColumn.js",
  }),
  code: `const fs = require('fs');
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

const { rows, delimiter } = parseCSV(csv);

const updatedRows = addColumnToCSVRows(rows, column, values);

const result = serializeCSV(updatedRows, delimiter);

if (typeof outputFile === "string") {
  fs.writeFileSync(outputFile, result);
}

return result;
`,
};

const csvFilterRows = {
  name: "csv.filterRows",
  definition: `{
"name": "csv.filterRows",
"description": "Filters and returns rows from a CSV dataset based on a specified column index and a search string",
"arguments": "{ csv: string, columnName: string, filterValue: string, outputFile: string }",
"code": "./csv.filterRows.js"
}`,
  code: `const fs = require('fs');
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
  fs.writeFileSync(outputFile, result);
}

return result;
`,
};

const csvJoinableColumns = {
  name: "csv.joinableColumns",
  definition: `
{
  "name": "csv.joinableColumns",
  "description": "Determine which columns in two CSVs can be joined",
  "arguments": "{ csv1: string, csv2: string }",
  "code": "./csv.joinableColumns.js"
}`,
  code: `
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
`,
};

const csvOrderColumns = {
  name: "csv.orderColumns",
  definition: `
{
  "name": "csv.orderColumns",
  "description": "Order the columns of a CSV alphabetically",
  "arguments": "{ csv: string, outputFile: string }",
  "code": "./csv.orderColumns.js"
}`,
  code: `const fs = require('fs');
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

function orderColumnsAlphabetically(rows) {
  const header = rows[0];

  // Get an array of indices ordered by the corresponding column's header
  const orderedIndices = header.map((_, index) => index).sort((a, b) => {
    const valueA = header[a].trim().toLowerCase();
    const valueB = header[b].trim().toLowerCase();

    if (valueA < valueB) return -1;
    if (valueA > valueB) return 1;
    return 0;
  });

  // Use the ordered indices to reorder the columns for each row
  const reorderedRows = rows.map(row => orderedIndices.map(index => row[index]));

  return reorderedRows;
}

const { rows, delimiter } = parseCSV(csv);

const reorderedRows = orderColumnsAlphabetically(rows);

const result = serializeCSV(reorderedRows, delimiter);

if (typeof outputFile === "string") {
  fs.writeFileSync(outputFile, result);
}

return result;
`,
};

const csvSortByColumn = {
  name: "csv.sortByColumn",
  definition: `
{
  "name": "csv.sortByColumn",
  "description": "Sort a column in a CSV",
  "arguments": "{ csv: string, columnIndex: number, outputFile: string }",
  "code": "./csv.sortByColumn.js"
}`,
  code: `
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

function sortCSVByColumn(rows, columnIndex) {
  // Extract the header from rows
  const header = rows[0];

  // Sort the rows based on the values in the specified column
  // Note: We start sorting from index 1 to skip the header row
  const sortedDataRows = rows.slice(1).sort((a, b) => {
    // Assuming you want to sort as strings, if you need to sort as numbers, convert them first
    const valueA = a[columnIndex].trim();
    const valueB = b[columnIndex].trim();

    if (valueA < valueB) return -1;
    if (valueA > valueB) return 1;
    return 0;
  });

  // Add the header row back to the top
  return [header].concat(sortedDataRows);
}

const { rows, delimiter } = parseCSV(csv);

const sortedRows = sortCSVByColumn(rows, columnIndex);

const result = serializeCSV(sortedRows, delimiter);

if (typeof outputFile === "string") {
  fs.writeFileSync(outputFile, result);
}

return result;
`,
};

const csvJoinByColumn = {
  name: "csv.joinByColumn",
  definition: `
{
  "name": "csv.joinByColumn",
  "description": "Join two CSVs by a shared column name",
  "arguments": "{ csv1: string, csv2: string, joinColumnName: string, outputFile: string }",
  "code": "./csv.joinByColumn.js"
}`,
  code: `
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
    throw new Error(\`Join column "\${columnName}" not found in one of the CSVs.\`);
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
  return \`\${serializedHeaders}\n\${serializedDataRows}\`;
}

const result = joinCSVs(csv1, csv2, joinColumnName);

if (typeof outputFile === "string") {
  fs.writeFileSync(outputFile, result);
}

return result;
`,
};

const csvSumColumn = {
  name: "csv.sumColumn",
  definition: `
{
  "name": "csv.sumColumn",
  "description": "Sum a column of a CSV",
  "arguments": "{ csv: string, columnName: string }",
  "code": "./csv.sumColumn.js"
}`,
  code: `
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
  
  const { rows } = parseCSV(csv);
  const [header, ...otherRows] = rows;
  const columnIndex = header.indexOf(columnName);
  
  let sum = 0;
  
  // Start from 1 if there's a header row
  for (let i = 0; i < otherRows.length; i++) {
    const value = parseFloat(otherRows[i][columnIndex]);
    if (!isNaN(value)) {
      sum += value;
    }
  }
  
  return sum;
`,
};

const readDirectory = {
  name: "fs.readDirectory",
  definition: `{
    "name": "fs.readDirectory",
    "description": "Reads the contents of the directory",
    "arguments": "{ path: string }",
    "code": "./fs.readDirectory.js"
  }`,
  code: `const fs = require('fs');
  try {
    const data = fs.readdirSync(path);
    return data;
  } catch (error) {
    throw error;
  }`,
};

const webSearch = {
  name: "web.search",
  definition: `{
    "name": "web.search",
    "description": "Searches the web for a given query, scrapes the results and returns them as a JSON string (tags: http, google)",
    "arguments": "{ query: string }",
    "code": "./web.search.js"
  }`,
  code: `
const result = __wrap_subinvoke(
  "plugin/websearch",
  "search",
  { query }
)
if (!result.ok) {
  throw result.error;
}
return result.value;
`,
};

const webFuzzySearch = {
  name: "web.fuzzySearch",
  definition: `{
  "name": "web.fuzzySearch",
  "description": "The fuzzy search function conducts a targeted search on a web page, using a text query comprised of specific keywords. Unlike broad or naive search methods, this function employs advanced algorithms to find close matches, even if they're not exact. This ensures a higher likelihood of retrieving relevant and precise information. When crafting your query, prioritize using distinct keywords to optimize the accuracy of the search results.",
  "arguments": "{ url: string, queryKeywords: string[] }",
  "code": "./web.fuzzySearch.js"
}`,
  code: `const result = __wrap_subinvoke(
  "plugin/fuzzySearch",
  "search",
  { url, queryKeywords }
)
if (!result.ok) {
  throw result.error;
}
return result.value;
`,
};
