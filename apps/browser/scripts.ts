import { InMemoryWorkspace, Workspace } from "@evo-ninja/agent-utils";

export function createInBrowserScripts(): InMemoryWorkspace {
  const workspace = new InMemoryWorkspace();

  const availableScripts = [
    agentAsk,
    agentOnGoalAchieved,
    agentOnGoalFailed,
    agentSpeak,
    cryptoGetPrice,
    csvAddColumn,
    csvFilterRows,
    csvJoinByColumn,
    csvJoinableColumns,
    csvOrderColumns,
    csvSortByColumn,
    csvSumColumn,
    fsReadDirectory,
    fsReadFile,
    fsUpdateFile,
    fsWriteFile,
    mathCalculateCircleArea,
    mathCalculatePerimeterOfSquare,
    mathDivide,
    mathFactorial,
    mathSin,
    mathSum,
    pathResolve,
    webFuzzySearch,
    webScrapeLinks,
    webSearch,
  ]
  availableScripts.forEach((script) => addScript(script, workspace));

  return workspace;
}


function addScript(
  script: { name: string; definition: string; code: string },
  scriptsWorkspace: Workspace
) {
  scriptsWorkspace.writeFileSync(script.name.concat(".json"), script.definition);
  scriptsWorkspace.writeFileSync(script.name.concat(".js"), script.code);
}

// Scripts embedded below
const agentAsk = {
    name: "agent.ask",
    definition: JSON.stringify({
    "name":"agent.ask",
    "description":"Sends a message to the user and waits for user response.",
    "arguments":"{ message: string }",
    "code":"./agent.ask.js"
}),
    code: `return __wrap_subinvoke(
  'plugin/agent',
  'ask',
  { message: message }
).value
`
}
const agentOnGoalAchieved = {
    name: "agent.onGoalAchieved",
    definition: JSON.stringify({
    "name":"agent.onGoalAchieved",
    "description":"Informs the user that the goal has been achieved.",
    "arguments":"{ message: string }",
    "code":"./agent.onGoalAchieved.js"
}),
    code: `return __wrap_subinvoke(
  'plugin/agent',
  'onGoalAchieved',
  { message }
).value
`
}
const agentOnGoalFailed = {
    name: "agent.onGoalFailed",
    definition: JSON.stringify({
    "name":"agent.onGoalFailed",
    "description":"Informs the user that the agent could not achieve the goal.",
    "arguments":"{ message: string }",
    "code":"./agent.onGoalFailed.js"
}),
    code: `return __wrap_subinvoke(
  'plugin/agent',
  'onGoalFailed',
  { message }
).value
`
}
const agentSpeak = {
    name: "agent.speak",
    definition: JSON.stringify({
    "name":"agent.speak",
    "description":"Informs the user by sending a message.",
    "arguments":"{ message: string }",
    "code":"./agent.speak.js"
}),
    code: `return __wrap_subinvoke(
  'plugin/agent',
  'speak',
  { message: message }
).value
`
}
const cryptoGetPrice = {
    name: "crypto.getPrice",
    definition: JSON.stringify({
  "name": "crypto.getPrice",
  "description": "Get the current price of a specified cryptocurrency.",
  "arguments": "{ currency: string }",
  "code": "./crypto.getPrice.js"
}),
    code: `const axios = require('axios');

const url = 'https://api.coingecko.com/api/v3/simple/price';
const params = {
  ids: currency,
  vs_currencies: 'usd'
};

try {
  const response = await axios.get(url, { params });
  return response.data[currency].usd;
} catch (error) {
  throw new Error(\`Could not fetch price for \${currency}: \${error.message}\`);
}`
}
const csvAddColumn = {
    name: "csv.addColumn",
    definition: JSON.stringify({
  "name": "csv.addColumn",
  "description": "Adds a new column to a CSV",
  "arguments": "{ csv: string, column: string, values: string[], outputFile: string }",
  "code": "./csv.addColumn.js"
}),
    code: `const fs = require('fs');
const path = require('path');

function detectDelimiter(row) {
  const supportedDelimiters = [",", ";", "\\t", "|", ":"];

  for (let delimiter of supportedDelimiters) {
      if (row.includes(delimiter)) {
          return delimiter;
      }
  }

  return supportedDelimiters[0];
}

function parseCSV(data) {
  if (data.indexOf("\\n") === -1 && path.extname(data) === ".csv") {
    data = fs.readFileSync(data, "utf-8");
  }
  const rows = data.trim().split('\\n');
  const delimiter = detectDelimiter(rows[0]);
  return { rows: rows.map(row => row.split(delimiter)), delimiter };
}

function serializeCSV(rows, delimiter) {
  return rows.map(row => row.join(delimiter)).join("\\n");
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
`
}
const csvFilterRows = {
    name: "csv.filterRows",
    definition: JSON.stringify({
  "name": "csv.filterRows",
  "description": "Filters and returns rows from a CSV dataset based on a specified column index and a search string",
  "arguments": "{ csv: string, columnName: string, filterValue: string, outputFile: string }",
  "code": "./csv.filterRows.js"
}),
    code: `const fs = require('fs');
const path = require('path');

function detectDelimiter(row) {
  const supportedDelimiters = [",", ";", "\\t", "|", ":"];

  for (let delimiter of supportedDelimiters) {
      if (row.includes(delimiter)) {
          return delimiter;
      }
  }

  return supportedDelimiters[0];
}

function parseCSV(data) {
  if (data.indexOf("\\n") === -1 && path.extname(data) === ".csv") {
    data = fs.readFileSync(data, "utf-8");
  }
  const rows = data.trim().split('\\n');
  const delimiter = detectDelimiter(rows[0]);
  return { rows: rows.map(row => row.split(delimiter)), delimiter };
}

function serializeCSV(rows, delimiter) {
  return rows.map(row => row.join(delimiter)).join("\\n");
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
`
}
const csvJoinByColumn = {
    name: "csv.joinByColumn",
    definition: JSON.stringify({
  "name": "csv.joinByColumn",
  "description": "Join two CSVs by a shared column name",
  "arguments": "{ csv1: string, csv2: string, joinColumnName: string, outputFile: string }",
  "code": "./csv.joinByColumn.js"
}),
    code: `const fs = require('fs');
const path = require('path');

function detectDelimiter(row) {
  const supportedDelimiters = [",", ";", "\\t", "|", ":"];

  for (let delimiter of supportedDelimiters) {
      if (row.includes(delimiter)) {
          return delimiter;
      }
  }

  return supportedDelimiters[0];
}

function parseCSV(data) {
  if (data.indexOf("\\n") === -1 && path.extname(data) === ".csv") {
    data = fs.readFileSync(data, "utf-8");
  }
  const rows = data.trim().split('\\n');
  const delimiter = detectDelimiter(rows[0]);
  return { rows: rows.map(row => row.split(delimiter)), delimiter };
}

function serializeCSV(rows, delimiter) {
  return rows.map(row => row.join(delimiter)).join("\\n");
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
  return \`\${serializedHeaders}\\n\${serializedDataRows}\`;
}

const result = joinCSVs(csv1, csv2, joinColumnName);

if (typeof outputFile === "string") {
  fs.writeFileSync(outputFile, result);
}

return result;
`
}
const csvJoinableColumns = {
    name: "csv.joinableColumns",
    definition: JSON.stringify({
  "name": "csv.joinableColumns",
  "description": "Determine which columns in two CSVs can be joined",
  "arguments": "{ csv1: string, csv2: string }",
  "code": "./csv.joinableColumns.js"
}),
    code: `const fs = require('fs');
const path = require('path');

function detectDelimiter(row) {
  const supportedDelimiters = [",", ";", "\\t", "|", ":"];

  for (let delimiter of supportedDelimiters) {
      if (row.includes(delimiter)) {
          return delimiter;
      }
  }

  return supportedDelimiters[0];
}

function parseCSV(data) {
  if (data.indexOf("\\n") === -1 && path.extname(data) === ".csv") {
    data = fs.readFileSync(data, "utf-8");
  }
  const rows = data.trim().split('\\n');
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
`
}
const csvOrderColumns = {
    name: "csv.orderColumns",
    definition: JSON.stringify({
  "name": "csv.orderColumns",
  "description": "Order the columns of a CSV alphabetically",
  "arguments": "{ csv: string, outputFile: string }",
  "code": "./csv.orderColumns.js"
}),
    code: `const fs = require('fs');
const path = require('path');

function detectDelimiter(row) {
  const supportedDelimiters = [",", ";", "\\t", "|", ":"];

  for (let delimiter of supportedDelimiters) {
      if (row.includes(delimiter)) {
          return delimiter;
      }
  }

  return supportedDelimiters[0];
}

function parseCSV(data) {
  if (data.indexOf("\\n") === -1 && path.extname(data) === ".csv") {
    data = fs.readFileSync(data, "utf-8");
  }
  const rows = data.trim().split('\\n');
  const delimiter = detectDelimiter(rows[0]);
  return { rows: rows.map(row => row.split(delimiter)), delimiter };
}

function serializeCSV(rows, delimiter) {
  return rows.map(row => row.join(delimiter)).join("\\n");
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
`
}
const csvSortByColumn = {
    name: "csv.sortByColumn",
    definition: JSON.stringify({
  "name": "csv.sortByColumn",
  "description": "Sort a column in a CSV",
  "arguments": "{ csv: string, columnIndex: number, outputFile: string }",
  "code": "./csv.sortByColumn.js"
}),
    code: `const fs = require('fs');
const path = require('path');

function detectDelimiter(row) {
  const supportedDelimiters = [",", ";", "\\t", "|", ":"];

  for (let delimiter of supportedDelimiters) {
      if (row.includes(delimiter)) {
          return delimiter;
      }
  }

  return supportedDelimiters[0];
}

function parseCSV(data) {
  if (data.indexOf("\\n") === -1 && path.extname(data) === ".csv") {
    data = fs.readFileSync(data, "utf-8");
  }
  const rows = data.trim().split('\\n');
  const delimiter = detectDelimiter(rows[0]);
  return { rows: rows.map(row => row.split(delimiter)), delimiter };
}

function serializeCSV(rows, delimiter) {
  return rows.map(row => row.join(delimiter)).join("\\n");
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
`
}
const csvSumColumn = {
    name: "csv.sumColumn",
    definition: JSON.stringify({
  "name": "csv.sumColumn",
  "description": "Sum a column of a CSV",
  "arguments": "{ csv: string, columnName: string }",
  "code": "./csv.sumColumn.js"
}),
    code: `const fs = require('fs');
const path = require('path');

function detectDelimiter(row) {
  const supportedDelimiters = [",", ";", "\\t", "|", ":"];

  for (let delimiter of supportedDelimiters) {
      if (row.includes(delimiter)) {
          return delimiter;
      }
  }

  return supportedDelimiters[0];
}

function parseCSV(data) {
  if (data.indexOf("\\n") === -1 && path.extname(data) === ".csv") {
    data = fs.readFileSync(data, "utf-8");
  }
  const rows = data.trim().split('\\n');
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
`
}
const fsReadDirectory = {
    name: "fs.readDirectory",
    definition: JSON.stringify({
  "name": "fs.readDirectory",
  "description": "Reads the contents of the directory",
  "arguments": "{ path: string }",
  "code": "./fs.readDirectory.js"
}),
    code: `const fs = require('fs');
try {
  const data = fs.readdirSync(path);
  return data;
} catch (error) {
  throw error;
}`
}
const fsReadFile = {
    name: "fs.readFile",
    definition: JSON.stringify({
  "name": "fs.readFile",
  "description": "Reads data from a file",
  "arguments": "{ path: string, encoding: string }",
  "code": "./fs.readFile.js"
}),
    code: `const fs = require('fs');
try {
  const data = fs.readFileSync(path, encoding);
  return data;
} catch (error) {
  throw error;
}`
}
const fsUpdateFile = {
    name: "fs.updateFile",
    definition: JSON.stringify({
  "name": "fs.updateFile",
  "description": "Removes the text between [startLn, endLn) in a file and inserts new content at startLn. endLn defaults to the length of the document (in lines). Line numbers are 0-indexed.",
  "arguments": "{ path: string, content: string, startLn: number, endLn?: number }",
  "code": "./fs.updateFile.js"
}),
    code: `const fs = require("fs");
try {
  if (!fs.existsSync(path)) {
    throw new Error(\`File does not exist at \${path}\`);
  }
  const originalContent = fs.readFileSync(path, "utf-8");
  const lines = originalContent.split("\\n");

  const start = startLn < 0 ? 0 : startLn;

  const end = endLn === undefined
    ? lines.length
    // allow end to exceed original content length
    : endLn > lines.length
      ? lines.length
      // nothing is extracted if end <= start
      : endLn < start
        ? start
        : endLn;

  // allow start to exceed original content length
  while (start > lines.length) lines.push("");

  const keepFromStart = lines.slice(0, start);
  const keepFromEnd = lines.slice(end);
  const newContent = [...keepFromStart, content, ...keepFromEnd].join("\\n");

  fs.writeFileSync(path, newContent, "utf-8");
} catch (error) {
  throw new Error(\`Failed to write file: \${error.message}\`);
}`
}
const fsWriteFile = {
    name: "fs.writeFile",
    definition: JSON.stringify({
  "name": "fs.writeFile",
  "description": "Writes data to a file, replacing the file if it already exists.",
  "arguments": "{ path: string, data: string, encoding: string }",
  "code": "./fs.writeFile.js"
}),
    code: `const fs = require('fs');
try {
  fs.writeFileSync(path, data, encoding);
} catch (error) {
  throw new Error(\`Failed to write file: \${error.message}\`);
}`
}
const mathCalculateCircleArea = {
    name: "math.calculateCircleArea",
    definition: JSON.stringify({
  "name": "math.calculateCircleArea",
  "description": "Calculates the area of a circle given its radius",
  "arguments": "{ radius: number }",
  "code": "./math.calculateCircleArea.js"
}),
    code: `if (typeof radius !== 'number' || radius <= 0) {
  throw new Error('Invalid radius. Please provide a positive number.');
}

return Math.PI * Math.pow(radius, 2);`
}
const mathCalculatePerimeterOfSquare = {
    name: "math.calculatePerimeterOfSquare",
    definition: JSON.stringify({
  "name": "math.calculatePerimeterOfSquare",
  "description": "Calculates the perimeter of a square given the length of one side.",
  "arguments": "{ sideLength: number }",
  "code": "./math.calculatePerimeterOfSquare.js"
}),
    code: `return sideLength * 4;`
}
const mathDivide = {
    name: "math.divide",
    definition: JSON.stringify({
  "name": "math.divide",
  "description": "This script divides two numbers and returns the result.",
  "arguments": "{ numerator: number, denominator: number }",
  "code": "./math.divide.js"
}),
    code: `if (denominator === 0) {
  throw new Error('Cannot divide by zero');
}
return numerator / denominator;`
}
const mathFactorial = {
    name: "math.factorial",
    definition: JSON.stringify({
  "name": "math.factorial",
  "description": "Calculate the factorial of a number",
  "arguments": "{ number: number }",
  "code": "./math.factorial.js"
}),
    code: `let result = 1;
for(let i = number; i > 0; i--){
  result *= i;
}
return result;`
}
const mathSin = {
    name: "math.sin",
    definition: JSON.stringify({
  "name": "math.sin",
  "description": "Calculate the sine of a given angle in degrees",
  "arguments": "{ angle: number }",
  "code": "./math.sin.js"
}),
    code: `let radians = angle * (Math.PI / 180);
return Math.sin(radians);`
}
const mathSum = {
    name: "math.sum",
    definition: JSON.stringify({
  "name": "math.sum",
  "description": "Calculate the sum of a range of numbers",
  "arguments": "{ start: number, end: number }",
  "code": "./math.sum.js"
}),
    code: `let sum = 0;
for(let i = start; i <= end; i++) {
  sum += i;
}
return sum;`
}
const pathResolve = {
    name: "path.resolve",
    definition: JSON.stringify({
  "name": "path.resolve",
  "description": "resolve the path to a file or directory to an absolute path",
  "arguments": "{ path: string }",
  "code": "./path.resolve.js"
}),
    code: `return require('path').resolve(path);`
}
const webFuzzySearch = {
    name: "web.fuzzySearch",
    definition: JSON.stringify({
  "name": "web.fuzzySearch",
  "description": "The fuzzy search function conducts a targeted search on a web page, using a text query comprised of specific keywords. Unlike broad or naive search methods, this function employs advanced algorithms to find close matches, even if they're not exact. This ensures a higher likelihood of retrieving relevant and precise information. When crafting your query, prioritize using distinct keywords to optimize the accuracy of the search results.",
  "arguments": "{ url: string, queryKeywords: string[] }",
  "code": "./web.fuzzySearch.js"
}

),
    code: `const result = __wrap_subinvoke(
  "plugin/fuzzySearch",
  "search",
  { url, queryKeywords }
)
if (!result.ok) {
  throw result.error;
}
return result.value;
`
}
const webScrapeLinks = {
    name: "web.scrapeLinks",
    definition: JSON.stringify({
  "name": "web.scrapeLinks",
  "description": "Open a web page and scrape all links found in the html",
  "arguments": "{ url: string }",
  "code": "./web.scrapeLinks.js"
}
),
    code: `const result = __wrap_subinvoke(
  "wrapscan.io/polywrap/web-scraper@1.0",
  "get_links",
  { url }
)
if (!result.ok) {
  throw result.error;
}
return result.value;
`
}
const webSearch = {
    name: "web.search",
    definition: JSON.stringify({
  "name": "web.search",
  "description": "Searches the web for a given query, scrapes the results and returns them as a JSON string (tags: http, google)",
  "arguments": "{ query: string }",
  "code": "./web.search.js"
}

),
    code: `const result = __wrap_subinvoke(
  "plugin/websearch",
  "search",
  { query }
)
if (!result.ok) {
  throw result.error;
}
return result.value;
`
}
